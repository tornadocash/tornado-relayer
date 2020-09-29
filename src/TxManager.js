const Web3 = require('web3')
const { Mutex } = require('async-mutex')
const { GasPriceOracle } = require('gas-price-oracle')
const { toWei, toHex, toBN, BN } = require('web3-utils')
const { sleep, when } = require('./utils')

const nonceErrors = [
  'Returned error: Transaction nonce is too low. Try incrementing the nonce.',
  'Returned error: nonce too low',
]

const gasPriceErrors = [
  'Returned error: Transaction gas price supplied is too low. There is another transaction with same nonce in the queue. Try increasing the gas price or incrementing the nonce.',
  'Returned error: replacement transaction underpriced',
]

const defaultConfig = {
  MAX_RETRIES: 10,
  GAS_BUMP_PERCENTAGE: 5,
  GAS_BUMP_INTERVAL: 1000 * 60 * 5,
  MAX_GAS_PRICE: 1000,
  POLL_INTERVAL: 3000,
}


class TxManager {
  constructor({ privateKey, rpcUrl, broadcastNodes = [], config = {} }) {
    this.config = Object.assign({ ...defaultConfig }, config)
    this._privateKey = privateKey
    this._web3 = new Web3(rpcUrl)
    this._broadcastNodes = broadcastNodes
    this.address = this._web3.eth.accounts.privateKeyToAccount('0x' + privateKey).address
    this._web3.eth.accounts.wallet.add('0x' + privateKey)
    this._web3.eth.defaultAccount = this.address
    this._gasPriceOracle = new GasPriceOracle({ defaultRpc: rpcUrl })
    this._mutex = new Mutex()
  }

  // todo get rid of it
  async init() {
    this.nonce = await this.web3.eth.getTransactionCount(this.address, 'latest')
  }

  /**
   * Submits transaction to Ethereum network. Resolves when tx gets enough confirmations.
   * todo: return PromiEvent that emits progress events
   *
   * @param tx Transaction to send
   */
  async submit(tx) {
    const release = await this._mutex.acquire()
    try {
      await new Transaction(tx, this).submit()
    } finally {
      release()
    }
  }
}

class Transaction {
  constructor(tx, manager) {
    Object.assign(this, manager)
    this.manager = manager
    this.tx = tx
    this.retries = 0
    this.hash = null
    // store all submitted hashes to catch cases when an old tx is mined
    // todo: what to do if old tx with the same nonce was submitted
    //       by other client and we don't have its hash?
    this.hashes = []
  }

  async submit() {
    await this._prepare()
    await this._send()
    // we could have bumped nonce during execution, so get the latest one + 1
    this.manager.nonce = this.tx.nonce + 1
  }

  async _prepare() {
    this.tx.gas = await this._web3.eth.estimateGas(this.tx)
    this.tx.gasPrice = await this._getGasPrice('fast')
    this.tx.nonce = this.nonce
  }

  async _send() {
    const signedTx = await this._web3.eth.accounts.signTransaction(this.tx, this.privateKey)
    this.tx.date = Date.now()
    this.tx.hash = signedTx.transactionHash
    this.hashes.push(this.tx.hash)
    try {
      await this._broadcast(signedTx.rawTransaction)
      // The most reliable way to see if one of our tx was mined is to track current nonce
      while(this.tx.nonce <= await this._getLastNonce()) {
        if (Date.now() - this.tx.date >= this.config.GAS_BUMP_INTERVAL) {
          if (this._increaseGasPrice()) {
            return this._send()
          }
        }

        await sleep(this.config.POLL_INTERVAL)
      }
    } catch (e) {
      await this._handleSendError()
    }
  }

  /**
   * Broadcasts tx to multiple nodes, waits for tx hash only on main node
   */
  _broadcast(rawTx) {
    const main = this._web3.eth.sendSignedTransaction(rawTx)
    for (const node of this._broadcastNodes) {
      try {
        new Web3(node).eth.sendSignedTransaction(rawTx)
      } catch (e) {
        console.log(`Failed to send transaction to node ${node}: ${e}`)
      }
    }
    return when(main, 'transactionHash')
  }

  _handleSendError(e) {
    console.log('Got error', e)

    // nonce is too low, trying to increase and resubmit
    if (nonceErrors.includes(e.message)) {
      console.log(`Nonce ${this.tx.nonce} is too low, increasing and retrying`)
      if (this.retries <= this.config.MAX_RETRIES) {
        this.tx.nonce++
        this.retries++
        return this._send()
      }
    }

    // there is already a pending tx with higher gas price, trying to bump and resubmit
    if (gasPriceErrors.includes(e.message)) {
      console.log(`Gas price ${this.tx.gasPrice} gwei is too low, increasing and retrying`)
      this._increaseGasPrice()
      return this._send()
    }
  }

  _increaseGasPrice() {
    const newGasPrice = toBN(this.tx.gasPrice).mul(toBN(this.config.GAS_BUMP_PERCENTAGE)).div(toBN(100))
    const maxGasPrice = toBN(toWei(this.config.MAX_GAS_PRICE.toString(), 'gwei'))
    if (toBN(this.tx.gasPrice).eq(maxGasPrice)) {
      console.log('Already at max gas price, not bumping')
      return false
    }
    this.tx.gasPrice = toHex(BN.min(newGasPrice, maxGasPrice))
    console.log(`Increasing gas price to ${this.tx.gasPrice}`)
    return true
  }

  async _getGasPrice(type) {
    const gasPrices = await this._gasPriceOracle.gasPrices()
    const result = gasPrices[type].toString()
    console.log(`${type} gas price is now ${result} gwei`)
    return toHex(toWei(gasPrices[type].toString(), 'gwei'))
  }

  _getLastNonce() {
    return this.web3.eth.getTransactionCount(this.address, 'latest')
  }
}

module.exports = TxManager

