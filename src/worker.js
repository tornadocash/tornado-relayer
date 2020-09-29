const { queue } = require('./queue')
const Web3 = require('web3')
const { rpcUrl, redisUrl, privateKey, netId, gasBumpInterval, gasBumpPercentage, maxGasPrice } = require('../config')
const { numberToHex, toWei, toHex, toBN, fromWei, toChecksumAddress, BN } = require('web3-utils')
const tornadoABI = require('../abis/tornadoABI.json')
const MerkleTree = require('fixed-merkle-tree')
const { setSafeInterval, poseidonHash2 } = require('./utils')
const Redis = require('ioredis')
const redis = new Redis(redisUrl)
const redisSubscribe = new Redis(redisUrl)
const { GasPriceOracle } = require('gas-price-oracle')
const gasPriceOracle = new GasPriceOracle({ defaultRpc: rpcUrl })
queue.process(process)
redisSubscribe.subscribe('treeUpdate', fetchTree)

let web3
let nonce
let currentTx
let currentJob
let tree

async function fetchTree() {
  const elements = await redis.get('tree:elements')
  const convert = (_, val) => typeof(val) === 'string' ? toBN(val) : val
  tree = MerkleTree.deserialize(JSON.parse(elements, convert), poseidonHash2)

  if (currentTx) {
    // todo replace
  }
}

async function watcher() {
  if (currentTx && Date.now() - currentTx.date > gasBumpInterval) {
    bumpGasPrice()
  }
}

async function bumpGasPrice() {
  const newGasPrice = toBN(currentTx.gasPrice).mul(toBN(gasBumpPercentage)).div(toBN(100))
  const maxGasPrice = toBN(toWei(maxGasPrice.toString(), 'Gwei'))
  currentTx.gasPrice = toHex(BN.min(newGasPrice, maxGasPrice))
  currentTx.date = Date.now()
  console.log(`Resubmitting with gas price ${fromWei(currentTx.gasPrice.toString(), 'gwei')} gwei`)
  await sendTx(currentTx, updateTxHash)
}

async function init() {
  web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
  const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
  web3.eth.accounts.wallet.add('0x' + privateKey)
  web3.eth.defaultAccount = account.address
  nonce = await web3.eth.getTransactionCount(account.address, 'latest')
  await fetchTree()
  setSafeInterval(watcher, 1000)
}

async function checkTornadoFee(contract, fee, refund) {

}

async function process(job) {
  if (job.type !== 'tornadoWithdraw') {
    throw new Error('not implemented')
  }
  currentJob = job
  console.log(Date.now(), ' withdraw started', job.id)
  const { proof, args, contract } = job.data
  const fee = toBN(args[4])
  const refund = toBN(args[5])
  await checkTornadoFee(contract, fee, refund)


  const instance = new web3.eth.Contract(tornadoABI, contract)
  const data = instance.methods.withdraw(proof, ...args).encodeABI()
  const gasPrices = await gasPriceOracle.gasPrices()
  currentTx = {
    from: web3.eth.defaultAccount,
    value: numberToHex(refund),
    gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
    to: contract,
    netId,
    data,
    nonce,
  }

  try {
    // eslint-disable-next-line require-atomic-updates
    currentTx.gas = await web3.eth.estimateGas(currentTx)
  }
  catch (e) {
    console.error('Revert', e)
    throw new Error(`Revert by smart contract ${e.message}`)
  }

  nonce++
  await sendTx(currentTx, updateTxHash)
}

async function waitForTx(hash) {

}

async function updateTxHash(txHash) {
  console.log(`A new successfully sent tx ${txHash}`)
  currentJob.data.txHash = txHash
  await currentJob.update(currentJob.data)
}

async function sendTx(tx, onTxHash, retryAttempt) {
  let signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey)
  let result = this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)

  if (onTxHash) {
    result.once('transactionHash', onTxHash)
  }

  try { // await returns once tx is mined
    await result
  } catch (e) {
    console.log(`Error for tx with nonce ${tx.nonce}\n${e.message}`)
    if (nonceErrors.includes(e.message)) {
      console.log('nonce too low, retrying')
      if (retryAttempt <= 10) {
        tx.nonce++
        return sendTx(tx, onTxHash, retryAttempt + 1)
      }
    }
    if (gasPriceErrors.includes(e.message)) {
      return bumpGasPrice()
    }
    throw new Error(e)
  }
}

const nonceErrors = [
  'Returned error: Transaction nonce is too low. Try incrementing the nonce.',
  'Returned error: nonce too low',
]

const gasPriceErrors = [
  'Returned error: Transaction gas price supplied is too low. There is another transaction with same nonce in the queue. Try increasing the gas price or incrementing the nonce.',
  'Returned error: replacement transaction underpriced',
]

async function main() {
  await init()

}

// main()
fetchTree()
