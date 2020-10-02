const fs = require('fs')
const Web3 = require('web3')
const { numberToHex, toBN } = require('web3-utils')
const MerkleTree = require('fixed-merkle-tree')
const Redis = require('ioredis')
const { GasPriceOracle } = require('gas-price-oracle')

const tornadoABI = require('../abis/tornadoABI.json')
const miningABI = require('../abis/mining.abi.json')
const swapABI = require('../abis/swap.abi.json')
const { queue } = require('./queue')
const { poseidonHash2 } = require('./utils')
const { rpcUrl, redisUrl, privateKey, updateConfig, swapAddress, minerAddress } = require('../config')
const { TxManager } = require('tx-manager')
const { Controller } = require('tornado-cash-anonymity-mining')

let web3
let currentTx
let currentJob
let tree
let txManager
let controller
const redis = new Redis(redisUrl)
const redisSubscribe = new Redis(redisUrl)
const gasPriceOracle = new GasPriceOracle({ defaultRpc: rpcUrl })

async function fetchTree() {
  console.log('got tree update')
  const elements = await redis.get('tree:elements')
  const convert = (_, val) => (typeof val === 'string' ? toBN(val) : val)
  tree = MerkleTree.deserialize(JSON.parse(elements, convert), poseidonHash2)

  if (currentTx && currentJob && ['miningReward', 'miningWithdraw'].includes(currentJob.data.type)) {
    const { proof, args } = currentJob.data.data
    if (toBN(args.account.inputRoot).eq(toBN(tree.root()))) {
      return
    }

    const update = await controller.treeUpdate(args.account.outputCommitment, tree)

    const instance = new web3.eth.Contract(tornadoABI, minerAddress)
    const data =
      currentJob.data.type === 'miningReward'
        ? instance.methods.reward(proof, args, update.proof, update.args).encodeABI()
        : instance.methods.withdraw(proof, args, update.proof, update.args).encodeABI()
    currentTx = await currentTx.replace({
      to: minerAddress,
      data,
    })
    console.log('replaced pending tx')
  }
}

async function start() {
  web3 = new Web3(rpcUrl)
  txManager = new TxManager({ privateKey, rpcUrl })
  updateConfig({ rewardAccount: txManager.address })
  redisSubscribe.subscribe('treeUpdate', fetchTree)
  await fetchTree()
  const provingKeys = {
    treeUpdateCircuit: require('../keys/TreeUpdate.json'),
    treeUpdateProvingKey: fs.readFileSync('./keys/TreeUpdate_proving_key.bin').buffer,
  }
  controller = new Controller({ provingKeys })
  await controller.init()
  queue.process(process)
  console.log('Worker started')
}

async function checkTornadoFee(/* contract, fee, refund*/) {
  const { fast } = await gasPriceOracle.gasPrices()
  console.log('fast', fast)
}

async function checkMiningFee(points) {
  const swap = new web3.eth.Contract(swapABI, swapAddress)
  const TornAmount = await swap.getExpectedReturn(points).call()

  // todo: use desired torn/eth rate and compute the same way as in tornado
}

async function process(job) {
  switch (job.data.type) {
    case 'tornadoWithdraw':
      await processTornadoWithdraw(job)
      break
    case 'miningReward':
      await processMiningReward(job)
      break
    case 'miningWithdraw':
      await processMiningWithdraw(job)
      break
    default:
      throw new Error(`Unknown job type: ${job.data.type}`)
  }
}

async function processTornadoWithdraw(job) {
  currentJob = job
  console.log(`Start processing a new Tornado Withdraw job #${job.id}`)
  const { proof, args, contract } = job.data.data
  const fee = toBN(args[4])
  const refund = toBN(args[5])
  await checkTornadoFee(contract, fee, refund)

  const instance = new web3.eth.Contract(tornadoABI, contract)
  const data = instance.methods.withdraw(proof, ...args).encodeABI()
  currentTx = await txManager.createTx({
    value: numberToHex(refund),
    to: contract,
    data,
  })

  try {
    await currentTx
      .send()
      .on('transactionHash', updateTxHash)
      .on('mined', receipt => {
        console.log('Mined in block', receipt.blockNumber)
      })
      .on('confirmations', updateConfirmations)
  } catch (e) {
    console.error('Revert', e)
    throw new Error(`Revert by smart contract ${e.message}`)
  }
}

async function processMiningReward(job) {
  currentJob = job
  console.log(`Start processing a new Mining Reward job #${job.id}`)
  const { proof, args } = job.data.data

  const contract = new web3.eth.Contract(miningABI, minerAddress)
  const data = contract.methods.reward(proof, args).encodeABI()
  currentTx = await txManager.createTx({
    to: minerAddress,
    data,
  })

  try {
    await currentTx
      .send()
      .on('transactionHash', updateTxHash)
      .on('mined', receipt => {
        console.log('Mined in block', receipt.blockNumber)
      })
      .on('confirmations', updateConfirmations)
  } catch (e) {
    console.error('Revert', e)
    throw new Error(`Revert by smart contract ${e.message}`)
  }
}

async function processMiningWithdraw(job) {
  currentJob = job
  console.log(`Start processing a new Mining Withdraw job #${job.id}`)
  const { proof, args } = job.data.data

  const contract = new web3.eth.Contract(miningABI, minerAddress)
  const data = contract.methods.withdraw(proof, args).encodeABI()
  currentTx = await txManager.createTx({
    to: minerAddress,
    data,
  })

  try {
    await currentTx
      .send()
      .on('transactionHash', updateTxHash)
      .on('mined', receipt => {
        console.log('Mined in block', receipt.blockNumber)
      })
      .on('confirmations', updateConfirmations)
  } catch (e) {
    console.error('Revert', e)
    throw new Error(`Revert by smart contract ${e.message}`)
  }
}

async function updateTxHash(txHash) {
  console.log(`A new successfully sent tx ${txHash}`)
  currentJob.data.txHash = txHash
  await currentJob.update(currentJob.data)
}

async function updateConfirmations(confirmations) {
  console.log(`Confirmations count ${confirmations}`)
  currentJob.data.confirmations = confirmations
  await currentJob.update(currentJob.data)
}

module.exports = { start, process }
