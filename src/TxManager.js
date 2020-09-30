const Web3 = require('web3')
const { Mutex } = require('async-mutex')
const { GasPriceOracle } = require('gas-price-oracle')
const { toWei, toHex, toBN, BN, fromWei } = require('web3-utils')
const PromiEvent = require('web3-core-promievent')
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
  MIN_GWEI_BUMP: 1,
  GAS_BUMP_INTERVAL: 1000 * 60 * 5,
  MAX_GAS_PRICE: 1000,
  POLL_INTERVAL: 5000,
  CONFIRMATIONS: 8,
}

class TxManager {
  constructor({ privateKey, rpcUrl, broadcastNodes = [], config = {} }) {
    this.config = Object.assign({ ...defaultConfig }, config)
    this._privateKey = '0x' + privateKey
    this._web3 = new Web3(rpcUrl)
    this._broadcastNodes = broadcastNodes
    this.address = this._web3.eth.accounts.privateKeyToAccount(this._privateKey).address
    this._web3.eth.accounts.wallet.add(this._privateKey)
    this._web3.eth.defaultAccount = this.address
    this._gasPriceOracle = new GasPriceOracle({ defaultRpc: rpcUrl })
    this._mutex = new Mutex()
    this.nonce
  }

  /**
   * Creates Transaction class instance.
   *
   * @param tx Transaction to send
   */
  async createTx(tx) {
    try {
      await this._mutex.acquire()
      if (!this.nonce) {
        this.nonce = await this._web3.eth.getTransactionCount(this.address, 'latest')
      }
      return new Transaction(tx, this)
    } catch (e) {
      console.log('e', e)
      this._mutex.release()
    }
  }
}

class Transaction {
  constructor(tx, manager) {
    Object.assign(this, manager)
    this.manager = manager
    this.tx = tx
    this.promiReceipt = PromiEvent()
    this.emitter = this.promiReceipt.eventEmitter
    this.retries = 0
    // store all submitted hashes to catch cases when an old tx is mined
    // todo: what to do if old tx with the same nonce was submitted
    //       by other client and we don't have its hash?
    this.hashes = []
  }

  /**
   * Submits transaction to Ethereum network. Resolves when tx gets enough confirmations.
   * Emits progress events.
   */
  send() {
    this._prepare()
      .then(() => {
        this._send()
          .then((result) => this.promiReceipt.resolve(result))
          .catch((e) => this.promiReceipt.reject(e))
      })
      .catch((e) => this.promiReceipt.reject(e))
      .finally(this.manager._mutex.release())

    return this.emitter
  }

  /**
   * Replaces pending tx.
   *
   * @param tx Transaction to send
   */
  replace(tx) {
    // todo check if it's not mined yet
    console.log('Replacing...')
    this.tx = tx
    return this.send()
  }

  /**
   * Cancels pending tx.
   */
  cancel() {
    // todo check if it's not mined yet
    console.log('Canceling...')
    this.tx = {
      to: this.address,
      gasPrice: this.tx.gasPrice,
    }
    this._increaseGasPrice()
    return this.send()
  }

  async _prepare() {
    this.tx.gas = await this._web3.eth.estimateGas(this.tx)
    if (!this.tx.gasPrice) {
      this.tx.gasPrice = await this._getGasPrice('fast')
    }
    this.tx.nonce = this.manager.nonce
  }

  async _send() {
    const signedTx = await this._web3.eth.accounts.signTransaction(this.tx, this._privateKey)
    this.tx.date = Date.now()
    this.tx.hash = signedTx.transactionHash
    this.hashes.push(this.tx.hash)
    this.emitter.emit('transactionHash', signedTx.transactionHash)

    try {
      await this._broadcast(signedTx.rawTransaction)
      console.log('Broadcasted. Start waiting for mining...')
      // The most reliable way to see if one of our tx was mined is to track current nonce

      while (this.tx.nonce >= (await this._getLastNonce())) {
        if (Date.now() - this.tx.date >= this.config.GAS_BUMP_INTERVAL) {
          if (this._increaseGasPrice()) {
            console.log('Resubmit with higher gas price')
            return this._send()
          }
        }

        await sleep(this.config.POLL_INTERVAL)
      }

      let receipt = await this._getReceipts()
      let retryAttempt = 5
      while (retryAttempt >= 0 && !receipt) {
        await sleep(1000)
        receipt = await this._getReceipts()
        retryAttempt--
      }

      if (!receipt) {
        // resubmit
      }

      console.log('Mined. Start waiting for confirmations...')
      this.emitter.emit('mined', receipt)

      let currentBlock = await this._web3.eth.getBlockNumber()
      let confirmations = currentBlock > receipt.blockNumber ? currentBlock - receipt.blockNumber : 0
      while (confirmations <= this.config.CONFIRMATIONS) {
        this.emitter.emit('confirmations', confirmations)

        await sleep(this.config.POLL_INTERVAL)
        receipt = await this._getReceipts()
        if (!receipt) {
          // resubmit
        }
        currentBlock = await this._web3.eth.getBlockNumber()
        confirmations = currentBlock - receipt.blockNumber
      }

      // we could have bumped nonce during execution, so get the latest one + 1
      this.manager.nonce = this.tx.nonce + 1
      return receipt
    } catch (e) {
      console.log('_send', e)
      await this._handleSendError()
    }
  }

  async _getReceipts() {
    for (const hash of this.hashes.reverse()) {
      const receipt = await this._web3.eth.getTransactionReceipt(hash)
      if (receipt) {
        return receipt
      }
    }
    return null
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
    const minGweiBump = toBN(toWei(this.config.MIN_GWEI_BUMP.toString(), 'Gwei'))
    const oldGasPrice = toBN(this.tx.gasPrice)
    const newGasPrice = BN.max(
      oldGasPrice.mul(toBN(100 + this.config.GAS_BUMP_PERCENTAGE)).div(toBN(100)),
      oldGasPrice.add(minGweiBump),
    )
    const maxGasPrice = toBN(toWei(this.config.MAX_GAS_PRICE.toString(), 'gwei'))
    if (toBN(this.tx.gasPrice).eq(maxGasPrice)) {
      console.log('Already at max gas price, not bumping')
      return false
    }
    this.tx.gasPrice = toHex(BN.min(newGasPrice, maxGasPrice))
    console.log(`Increasing gas price to ${fromWei(this.tx.gasPrice, 'Gwei')}`)
    return true
  }

  async _getGasPrice(type) {
    const gasPrices = await this._gasPriceOracle.gasPrices()
    const result = gasPrices[type].toString()
    console.log(`${type} gas price is now ${result} gwei`)
    return toHex(toWei(gasPrices[type].toString(), 'gwei'))
  }

  _getLastNonce() {
    return this._web3.eth.getTransactionCount(this.address, 'latest')
  }
}

module.exports = TxManager
