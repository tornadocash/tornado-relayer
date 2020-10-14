const fs = require('fs')
const Web3 = require('web3')
const { toBN, toWei, fromWei } = require('web3-utils')
const MerkleTree = require('fixed-merkle-tree')
const Redis = require('ioredis')
const { GasPriceOracle } = require('gas-price-oracle')
const { Utils } = require('tornado-cash-anonymity-mining')

const tornadoABI = require('../abis/tornadoABI.json')
const miningABI = require('../abis/mining.abi.json')
const swapABI = require('../abis/swap.abi.json')
const { queue } = require('./queue')
const { poseidonHash2, getInstance, fromDecimals } = require('./utils')
const jobType = require('./jobTypes')
const {
  netId,
  httpRpcUrl,
  redisUrl,
  privateKey,
  swapAddress,
  minerAddress,
  gasLimits,
  instances,
  tornadoServiceFee,
  miningServiceFee,
} = require('./config')
const { TxManager } = require('tx-manager')
const { Controller } = require('tornado-cash-anonymity-mining')

let web3
let currentTx
let currentJob
let tree
let txManager
let controller
let swap
const redis = new Redis(redisUrl)
const redisSubscribe = new Redis(redisUrl)
const gasPriceOracle = new GasPriceOracle({ defaultRpc: httpRpcUrl })

const status = Object.freeze({
  ACCEPTED: 'ACCEPTED',
  SENT: 'SENT',
  MINED: 'MINED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
})

async function fetchTree() {
  const elements = await redis.get('tree:elements')
  const convert = (_, val) => (typeof val === 'string' ? toBN(val) : val)
  tree = MerkleTree.deserialize(JSON.parse(elements, convert), poseidonHash2)

  if (currentTx && currentJob && ['MINING_REWARD', 'MINING_WITHDRAW'].includes(currentJob.data.type)) {
    const { proof, args } = currentJob.data
    if (toBN(args.account.inputRoot).eq(toBN(tree.root()))) {
      console.log('Account root is up to date. Skipping Root Update operation...')
      return
    } else {
      console.log('Account root is outdated. Starting Root Update operation...')
    }

    const update = await controller.treeUpdate(args.account.outputCommitment, tree)

    const instance = new web3.eth.Contract(miningABI, minerAddress)
    const data =
      currentJob.data.type === 'MINING_REWARD'
        ? instance.methods.reward(proof, args, update.proof, update.args).encodeABI()
        : instance.methods.withdraw(proof, args, update.proof, update.args).encodeABI()
    await currentTx.replace({
      to: minerAddress,
      data,
    })
    console.log('replaced pending tx')
  }
}

async function start() {
  web3 = new Web3(httpRpcUrl)
  txManager = new TxManager({ privateKey, rpcUrl: httpRpcUrl, config: { CONFIRMATIONS: 6 } })
  swap = new web3.eth.Contract(swapABI, swapAddress)
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

function checkFee({ data }) {
  if (data.type === jobType.TORNADO_WITHDRAW) {
    return checkTornadoFee(data)
  }
  return checkMiningFee(data)
}

async function checkTornadoFee({ args, contract }) {
  const { currency, amount } = getInstance(contract)
  const { decimals } = instances[`netId${netId}`][currency]
  const [fee, refund] = [args[4], args[5]].map(toBN)
  const { fast } = await gasPriceOracle.gasPrices()

  const ethPrice = await redis.hget('prices', currency)
  const expense = toBN(toWei(fast.toString(), 'gwei')).mul(toBN(gasLimits[jobType.TORNADO_WITHDRAW]))
  const feePercent = toBN(fromDecimals(amount, decimals))
    .mul(toBN(tornadoServiceFee * 1e10))
    .div(toBN(1e10 * 100))
  let desiredFee
  switch (currency) {
    case 'eth': {
      desiredFee = expense.add(feePercent)
      break
    }
    default: {
      desiredFee = expense
        .add(refund)
        .mul(toBN(10 ** decimals))
        .div(toBN(ethPrice))
      desiredFee = desiredFee.add(feePercent)
      break
    }
  }
  console.log(
    'sent fee, desired fee, feePercent',
    fromWei(fee.toString()),
    fromWei(desiredFee.toString()),
    fromWei(feePercent.toString()),
  )
  if (fee.lt(desiredFee)) {
    throw new Error('Provided fee is not enough. Probably it is a Gas Price spike, try to resubmit.')
  }
}

async function checkMiningFee({ args }) {
  const { fast } = await gasPriceOracle.gasPrices()
  const ethPrice = await redis.hget('prices', 'torn')

  const expense = toBN(toWei(fast.toString(), 'gwei')).mul(toBN(gasLimits[currentJob.data.type]))
  const expenseInTorn = expense.mul(toBN(1e18)).div(toBN(ethPrice))
  // todo make aggregator for ethPrices and rewardSwap data
  const balance = await swap.methods.tornVirtualBalance().call()
  const poolWeight = await swap.methods.poolWeight().call()
  const expenseInPoints = Utils.reverseTornadoFormula({ balance, tokens: expenseInTorn, poolWeight })
  /* eslint-disable */
  const serviceFeePercent =
    currentJob.data.type === jobType.MINING_REWARD
      ? toBN(0)
      : toBN(args.amount)
          .mul(toBN(miningServiceFee * 1e10))
          .div(toBN(1e10 * 100))
  /* eslint-enable */
  const desiredFee = expenseInPoints.add(serviceFeePercent) // in points
  const providedFee = currentJob.data.type === jobType.MINING_REWARD ? args.fee : args.extData.fee
  console.log(
    'sent fee, desired fee, serviceFeePercent',
    toBN(providedFee).toString(),
    desiredFee.toString(),
    serviceFeePercent.toString(),
  )
  if (toBN(providedFee).lt(desiredFee)) {
    throw new Error('Provided fee is not enough. Probably it is a Gas Price spike, try to resubmit.')
  }
}

function getTxObject({ data }) {
  let [ABI, contractAddress, value, args] =
    data.type === jobType.TORNADO_WITHDRAW
      ? [tornadoABI, data.contract, data.args[5], data.args]
      : [miningABI, minerAddress, 0, [data.args]]
  const method = data.type !== jobType.MINING_REWARD ? 'withdraw' : 'reward'

  const contract = new web3.eth.Contract(ABI, contractAddress)
  const calldata = contract.methods[method](data.proof, ...args).encodeABI()

  return {
    value,
    to: contractAddress,
    data: calldata,
  }
}

async function process(job) {
  try {
    if (!jobType[job.data.type]) {
      throw new Error(`Unknown job type: ${job.data.type}`)
    }
    currentJob = job
    await updateStatus(status.ACCEPTED)
    console.log(`Start processing a new ${job.data.type} job #${job.id}`)
    await checkFee(job)
    currentTx = await txManager.createTx(getTxObject(job))

    if (job.data.type !== jobType.TORNADO_WITHDRAW) {
      await fetchTree()
    }

    try {
      await currentTx
        .send()
        .on('transactionHash', txHash => {
          updateTxHash(txHash)
          updateStatus(status.SENT)
        })
        .on('mined', receipt => {
          console.log('Mined in block', receipt.blockNumber)
          updateStatus(status.MINED)
        })
        .on('confirmations', updateConfirmations)

      await updateStatus(status.CONFIRMED)
    } catch (e) {
      console.error('Revert', e)
      throw new Error(`Revert by smart contract ${e.message}`)
    }
  } catch (e) {
    console.error(e)
    await updateStatus(status.FAILED)
    throw e
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

async function updateStatus(status) {
  console.log(`Job status updated ${status}`)
  currentJob.data.status = status
  await currentJob.update(currentJob.data)
}

start()

module.exports = { start, process }
