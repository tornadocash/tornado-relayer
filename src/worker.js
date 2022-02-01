const fs = require('fs')
const Web3 = require('web3')
const { toBN, toWei, fromWei, toChecksumAddress } = require('web3-utils')
const MerkleTree = require('fixed-merkle-tree')
const Redis = require('ioredis')
const { GasPriceOracle } = require('gas-price-oracle')
const { Utils, Controller } = require('tornado-anonymity-mining')

const swapABI = require('../abis/swap.abi.json')
const miningABI = require('../abis/mining.abi.json')
const tornadoABI = require('../abis/tornadoABI.json')
const tornadoProxyABI = require('../abis/tornadoProxyABI.json')
const aggregatorAbi = require('../abis/Aggregator.abi.json')
const { queue } = require('./queue')
const { poseidonHash2, getInstance, fromDecimals, sleep } = require('./utils')
const { jobType, status } = require('./constants')
const {
  torn,
  netId,
  redisUrl,
  gasLimits,
  instances,
  privateKey,
  httpRpcUrl,
  oracleRpcUrl,
  baseFeeReserve,
  miningServiceFee,
  tornadoServiceFee,
  tornadoGoerliProxy,
  governanceAddress,
  aggregatorAddress,
} = require('./config')
const ENSResolver = require('./resolver')
const resolver = new ENSResolver()
const { TxManager } = require('tx-manager')

let web3
let currentTx
let currentJob
let tree
let txManager
let controller
let swap
let minerContract
const redis = new Redis(redisUrl)
const redisSubscribe = new Redis(redisUrl)
const gasPriceOracle = new GasPriceOracle({ defaultRpc: oracleRpcUrl })

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

    const minerAddress = await resolver.resolve(torn.miningV2.address)
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
  try {
    web3 = new Web3(httpRpcUrl)
    const { CONFIRMATIONS, MAX_GAS_PRICE } = process.env
    txManager = new TxManager({
      privateKey,
      rpcUrl: httpRpcUrl,
      config: {
        CONFIRMATIONS,
        MAX_GAS_PRICE,
        THROW_ON_REVERT: false,
        BASE_FEE_RESERVE_PERCENTAGE: baseFeeReserve,
      },
    })
    swap = new web3.eth.Contract(swapABI, await resolver.resolve(torn.rewardSwap.address))
    minerContract = new web3.eth.Contract(miningABI, await resolver.resolve(torn.miningV2.address))
    redisSubscribe.subscribe('treeUpdate', fetchTree)
    await fetchTree()
    const provingKeys = {
      treeUpdateCircuit: require('../keys/TreeUpdate.json'),
      treeUpdateProvingKey: fs.readFileSync('./keys/TreeUpdate_proving_key.bin').buffer,
    }
    controller = new Controller({ provingKeys })
    await controller.init()
    queue.process(processJob)
    console.log('Worker started')
  } catch (e) {
    console.error('error on start worker', e.message)
  }
}

function checkFee({ data }) {
  if (data.type === jobType.TORNADO_WITHDRAW) {
    return checkTornadoFee(data)
  }
  return checkMiningFee(data)
}

async function getGasPrice() {
  const block = await web3.eth.getBlock('latest')

  if (block && block.baseFeePerGas) {
    const baseFeePerGas = toBN(block.baseFeePerGas)
    return baseFeePerGas
  }

  const { fast } = await gasPriceOracle.gasPrices()
  const gasPrice = toBN(toWei(fast.toString(), 'gwei'))
  return gasPrice
}

async function checkTornadoFee({ args, contract }) {
  const { currency, amount } = getInstance(contract)
  const { decimals } = instances[`netId${netId}`][currency]
  const [fee, refund] = [args[4], args[5]].map(toBN)
  const gasPrice = await getGasPrice()

  const ethPrice = await redis.hget('prices', currency)
  const expense = gasPrice.mul(toBN(gasLimits[jobType.TORNADO_WITHDRAW]))

  const feePercent = toBN(fromDecimals(amount, decimals))
    .mul(toBN(parseInt(tornadoServiceFee * 1e10)))
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
  const gasPrice = await getGasPrice()
  const ethPrice = await redis.hget('prices', 'torn')
  const isMiningReward = currentJob.data.type === jobType.MINING_REWARD
  const providedFee = isMiningReward ? toBN(args.fee) : toBN(args.extData.fee)

  const expense = gasPrice.mul(toBN(gasLimits[currentJob.data.type]))
  const expenseInTorn = expense.mul(toBN(1e18)).div(toBN(ethPrice))
  // todo make aggregator for ethPrices and rewardSwap data
  const balance = await swap.methods.tornVirtualBalance().call()
  const poolWeight = await swap.methods.poolWeight().call()
  const expenseInPoints = Utils.reverseTornadoFormula({ balance, tokens: expenseInTorn, poolWeight })
  /* eslint-disable */
  const serviceFeePercent = isMiningReward
    ? toBN(0)
    : toBN(args.amount)
        .sub(providedFee) // args.amount includes fee
        .mul(toBN(parseInt(miningServiceFee * 1e10)))
        .div(toBN(1e10 * 100))
  /* eslint-enable */
  const desiredFee = expenseInPoints.add(serviceFeePercent) // in points
  console.log(
    'user provided fee, desired fee, serviceFeePercent',
    providedFee.toString(),
    desiredFee.toString(),
    serviceFeePercent.toString(),
  )
  if (toBN(providedFee).lt(desiredFee)) {
    throw new Error('Provided fee is not enough. Probably it is a Gas Price spike, try to resubmit.')
  }
}

async function isLatestProposalExecuted() {
  const PROPOSAL_EXECUTED_STATUS = 5
  const expectedProposalId = 10
  try {
    const aggregator = new web3.eth.Contract(aggregatorAbi, aggregatorAddress)
    const proposals = await aggregator.methods.getAllProposals(governanceAddress).call()
    const expectedProposal = proposals[expectedProposalId - 1]
    return expectedProposal && Number(expectedProposal['state']) === PROPOSAL_EXECUTED_STATUS
  } catch (e) {
    console.error(e.message)
    return false
  }
}

async function getProxyContract() {
  let proxyAddress
  if (netId === 5) {
    proxyAddress = tornadoGoerliProxy
  } else {
    const latestProposalExecuted = await isLatestProposalExecuted()
    proxyAddress = latestProposalExecuted
      ? await resolver.resolve(torn.tornadoRouter.address)
      : await resolver.resolve(torn.tornadoProxy.address)
  }
  const contract = new web3.eth.Contract(tornadoProxyABI, proxyAddress)

  return {
    contract,
    isOldProxy: checkOldProxy(proxyAddress),
  }
}

function checkOldProxy(address) {
  const OLD_PROXY = '0x905b63Fff465B9fFBF41DeA908CEb12478ec7601'
  return toChecksumAddress(address) === toChecksumAddress(OLD_PROXY)
}

async function getTxObject({ data }) {
  if (data.type === jobType.TORNADO_WITHDRAW) {
    let { contract, isOldProxy } = await getProxyContract()

    let calldata = contract.methods.withdraw(data.contract, data.proof, ...data.args).encodeABI()

    if (isOldProxy && getInstance(data.contract).currency !== 'eth') {
      contract = new web3.eth.Contract(tornadoABI, data.contract)
      calldata = contract.methods.withdraw(data.proof, ...data.args).encodeABI()
    }

    return {
      value: data.args[5],
      to: contract._address,
      data: calldata,
      gasLimit: gasLimits['WITHDRAW_WITH_EXTRA'],
    }
  } else {
    const method = data.type === jobType.MINING_REWARD ? 'reward' : 'withdraw'
    const calldata = minerContract.methods[method](data.proof, data.args).encodeABI()
    return {
      to: minerContract._address,
      data: calldata,
      gasLimit: gasLimits[data.type],
    }
  }
}

async function isOutdatedTreeRevert(receipt, currentTx) {
  try {
    await web3.eth.call(currentTx.tx, receipt.blockNumber)
    console.log('Simulated call successful')
    return false
  } catch (e) {
    console.log('Decoded revert reason:', e.message)
    return (
      e.message.indexOf('Outdated account merkle root') !== -1 ||
      e.message.indexOf('Outdated tree update merkle root') !== -1
    )
  }
}

async function processJob(job) {
  try {
    if (!jobType[job.data.type]) {
      throw new Error(`Unknown job type: ${job.data.type}`)
    }
    currentJob = job
    await updateStatus(status.ACCEPTED)
    console.log(`Start processing a new ${job.data.type} job #${job.id}`)
    await submitTx(job)
  } catch (e) {
    console.error('processJob', e.message)
    await updateStatus(status.FAILED)
    throw e
  }
}

async function submitTx(job, retry = 0) {
  await checkFee(job)
  currentTx = await txManager.createTx(await getTxObject(job))

  if (job.data.type !== jobType.TORNADO_WITHDRAW) {
    await fetchTree()
  }

  try {
    const receipt = await currentTx
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

    if (receipt.status === 1) {
      await updateStatus(status.CONFIRMED)
    } else {
      if (job.data.type !== jobType.TORNADO_WITHDRAW && (await isOutdatedTreeRevert(receipt, currentTx))) {
        if (retry < 3) {
          await updateStatus(status.RESUBMITTED)
          await submitTx(job, retry + 1)
        } else {
          throw new Error('Tree update retry limit exceeded')
        }
      } else {
        throw new Error('Submitted transaction failed')
      }
    }
  } catch (e) {
    // todo this could result in duplicated error logs
    // todo handle a case where account tree is still not up to date (wait and retry)?
    if (
      job.data.type !== jobType.TORNADO_WITHDRAW &&
      (e.message.indexOf('Outdated account merkle root') !== -1 ||
        e.message.indexOf('Outdated tree update merkle root') !== -1)
    ) {
      if (retry < 5) {
        await sleep(3000)
        console.log('Tree is still not up to date, resubmitting')
        await submitTx(job, retry + 1)
      } else {
        throw new Error('Tree update retry limit exceeded')
      }
    } else {
      throw new Error(`Revert by smart contract ${e.message}`)
    }
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
