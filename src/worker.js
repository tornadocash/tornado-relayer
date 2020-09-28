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
    const newGasPrice = toBN(currentTx.gasPrice).mul(toBN(gasBumpPercentage)).div(toBN(100))
    const maxGasPrice = toBN(toWei(maxGasPrice.toString(), 'Gwei'))
    currentTx.gasPrice = toHex(BN.min(newGasPrice, maxGasPrice))
    currentTx.date = Date.now()
    console.log(`Resubmitting with gas price ${fromWei(currentTx.gasPrice.toString(), 'gwei')} gwei`)
    //await this.sendTx(tx, null, 9999)
  }
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
  console.log(Date.now(), ' withdraw started', job.id)
  const { proof, args, contract } = job.data
  const fee = toBN(args[4])
  const refund = toBN(args[5])
  await checkTornadoFee(contract, fee, refund)


  const instance = new web3.eth.Contract(tornadoABI, contract)
  const data = instance.methods.withdraw(proof, ...args).encodeABI()
  const gasPrices = await gasPriceOracle.gasPrices()
  const tx = {
    from: web3.eth.defaultAccount,
    value: numberToHex(refund),
    gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
    to: contract,
    netId,
    data,
    nonce,
  }
  // nonce++ later

  const gas = await web3.eth.estimateGas(tx)
  tx.gas = gas
  let signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey)
  let result = this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)

  result.once('transactionHash', async (txHash) => {
    console.log(`A new successfully sent tx ${txHash}`)
    job.data.txHash = txHash
    await job.update(job.data)
  })

  await result
}

async function main() {
  await init()

}

// main()
fetchTree()
