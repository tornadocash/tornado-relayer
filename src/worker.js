const Web3 = require('web3')
const { numberToHex, toBN } = require('web3-utils')
const MerkleTree = require('fixed-merkle-tree')
const Redis = require('ioredis')
const { GasPriceOracle } = require('gas-price-oracle')

const tornadoABI = require('../abis/tornadoABI.json')
const { queue } = require('./queue')
const { poseidonHash2 } = require('./utils')
const { rpcUrl, redisUrl, privateKey, updateConfig, rewardAccount } = require('../config')
const TxManager = require('./TxManager')

let web3
let currentTx
let currentJob
let tree
let txManager
const redis = new Redis(redisUrl)
const redisSubscribe = new Redis(redisUrl)
const gasPriceOracle = new GasPriceOracle({ defaultRpc: rpcUrl })

async function fetchTree() {
  const elements = await redis.get('tree:elements')
  const convert = (_, val) => (typeof val === 'string' ? toBN(val) : val)
  tree = MerkleTree.deserialize(JSON.parse(elements, convert), poseidonHash2)

  if (currentTx) {
    // todo replace
  }
}

async function start() {
  web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
  const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
  web3.eth.accounts.wallet.add('0x' + privateKey)
  web3.eth.defaultAccount = account.address
  updateConfig({ rewardAccount: account.address })
  txManager = new TxManager({ privateKey, rpcUrl })
  queue.process(process)
  redisSubscribe.subscribe('treeUpdate', fetchTree)
  await fetchTree()
  console.log('Worker started')
}

async function checkTornadoFee(/* contract, fee, refund*/) {
  const { fast } = await gasPriceOracle.gasPrices()
  console.log('fast', fast)
}

async function process(job) {
  if (job.data.type !== 'tornadoWithdraw') {
    throw new Error('not implemented')
  }
  currentJob = job
  console.log(Date.now(), ' withdraw started', job.id)
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
      .on('mined', (receipt) => {
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
