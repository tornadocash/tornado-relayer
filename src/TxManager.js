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
  /Returned error: Transaction gas price \d+wei is too low. There is another transaction with same nonce in the queue with gas price: \d+wei. Try increasing the gas price or incrementing the nonce./,
]

const sameTxErrors = [
  'Returned error: Transaction with the same hash was already imported.',
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
    this._nonce = null
  }

  /**
   * Creates Transaction class instance.
   *
   * @param tx Transaction to send
   */
  createTx(tx) {
    return new Transaction(tx, this)
  }
}

class Transaction {
  constructor(tx, manager) {
    Object.assign(this, manager)
    this.manager = manager
    this.tx = tx
    this._promise = PromiEvent()
    this._emitter = this._promise.eventEmitter
    this.executed = false
    this.retries = 0
    this.currentTxHash = null
    // store all submitted hashes to catch cases when an old tx is mined
    this.hashes = []
  }

  /**
   * Submits the transaction to Ethereum network. Resolves when tx gets enough confirmations.
   * Emits progress events.
   */
  send() {
    if (this.executed) {
      throw new Error('The transaction was already executed')
    }
    this.executed = true
    this._execute()
      .then(this._promise.resolve)
      .catch(this._promise.reject)
    return this._emitter
  }

  /**
   * Replaces a pending tx.
   *
   * @param tx Transaction to send
   */
  async replace(tx) {
    // todo throw error if the current transaction is mined already
    console.log('Replacing current transaction')
    if (!this.executed) {
      // Tx was not executed yet, just replace it
      this.tx = tx
      return
    }
    if (!tx.gas) {
      tx.gas = await this._web3.eth.estimateGas(tx)
    }
    tx.nonce = this.tx.nonce // can be different from `this.manager._nonce`
    tx.gasPrice = Math.max(this.tx.gasPrice, tx.gasPrice || 0) // start no less than current tx gas price

    this.tx = tx
    this._increaseGasPrice()
    await this._send()
  }

  /**
   * Cancels a pending tx.
   */
  cancel() {
    console.log('Canceling the transaction')
    return this.replace({
      from: this.address,
      to: this.address,
      value: 0,
      gas: 21000,
    })
  }

  /**
   * Executes the transaction. Acquires global mutex for transaction duration
   *
   * @returns {Promise<TransactionReceipt>}
   * @private
   */
  async _execute() {
    const release = await this.manager._mutex.acquire()
    try {
      await this._prepare()
      await this._send()
      const receipt = this._waitForConfirmations()
      // we could have bumped nonce during execution, so get the latest one + 1
      this.manager._nonce = this.tx.nonce + 1
      return receipt
    } finally {
      release()
    }
  }

  /**
   * Prepare first transaction before submitting it. Inits `gas`, `gasPrice`, `nonce`
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepare() {
    const gas = await this._web3.eth.estimateGas(this.tx)
    if (!this.tx.gas) {
      this.tx.gas = gas
    }
    if (!this.tx.gasPrice) {
      this.tx.gasPrice = await this._getGasPrice('fast')
    }
    if (!this.manager._nonce) {
      this.manager._nonce = await this._web3.eth.getTransactionCount(this.address, 'latest')
    }
    this.tx.nonce = this.manager._nonce
  }

  /**
   * Send the current transaction
   *
   * @returns {Promise}
   * @private
   */
  async _send() {
    // todo throw is we attempt to send a tx that attempts to replace already mined tx
    const signedTx = await this._web3.eth.accounts.signTransaction(this.tx, this._privateKey)
    this.submitTimestamp = Date.now()
    this.tx.hash = signedTx.transactionHash
    this.hashes.push(signedTx.transactionHash)

    try {
      await this._broadcast(signedTx.rawTransaction)
    } catch (e) {
      return this._handleSendError(e)
    }

    this._emitter.emit('transactionHash', signedTx.transactionHash)
    console.log(`Broadcasted transaction ${signedTx.transactionHash}`)
    console.log(this.tx)
  }

  /**
   * A loop that waits until the current transaction is mined and gets enough confirmations
   *
   * @returns {Promise<TransactionReceipt>} The transaction receipt
   * @private
   */
  async _waitForConfirmations() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // We are already waiting on certain tx hash
      if (this.currentTxHash) {
        const receipt = await this._web3.eth.getTransactionReceipt(this.currentTxHash)

        if (!receipt) {
          // We were waiting for some tx but it disappeared
          // Erase the hash and start over
          this.currentTxHash = null
          continue
        }

        const currentBlock = await this._web3.eth.getBlockNumber()
        const confirmations = Math.max(0, currentBlock - receipt.blockNumber)
        // todo don't emit repeating confirmation count
        this._emitter.emit('confirmations', confirmations)
        if (confirmations >= this.config.CONFIRMATIONS) {
          // Tx is mined and has enough confirmations
          return receipt
        }

        // Tx is mined but doesn't have enough confirmations yet, keep waiting
        await sleep(this.config.POLL_INTERVAL)
        continue
      }

      // Tx is still pending
      if (await this._getLastNonce() <= this.tx.nonce) {
        // todo optionally run estimateGas on each iteration and cancel the transaction if it fails

        // We were waiting too long, increase gas price and resubmit
        if (Date.now() - this.submitTimestamp >= this.config.GAS_BUMP_INTERVAL) {
          if (this._increaseGasPrice()) {
            console.log('Resubmitting with higher gas price')
            await this._send()
            continue
          }
        }
        // Tx is still pending, keep waiting
        await sleep(this.config.POLL_INTERVAL)
        continue
      }

      let receipt = await this._getReceipts()

      // There is a mined tx with current nonce, but it's not one of ours
      // Probably other tx submitted by other process/client
      if (!receipt) {
        console.log('Can\'t find our transaction receipt, retrying a few times')
        // Give node a few more attempts to respond with our receipt
        let retries = 5
        while (!receipt && retries--) {
          await sleep(1000)
          receipt = await this._getReceipts()
        }

        // Receipt was not found after a few retries
        // Resubmit our tx
        if (!receipt) {
          console.log('There is a mined tx with our nonce but unknown tx hash, resubmitting with tx with increased nonce')
          this.tx.nonce++
          // todo drop gas price to original value?
          await this._send()
          continue
        }
      }

      console.log('Mined. Start waiting for confirmations...')
      this._emitter.emit('mined', receipt)
      this.currentTxHash = receipt.transactionHash
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
    if (this._hasError(e.message, nonceErrors)) {
      console.log(`Nonce ${this.tx.nonce} is too low, increasing and retrying`)
      if (this.retries <= this.config.MAX_RETRIES) {
        this.tx.nonce++
        this.retries++
        return this._send()
      }
    }

    // there is already a pending tx with higher gas price, trying to bump and resubmit
    if (this._hasError(e.message, gasPriceErrors)) {
      console.log(`Gas price ${fromWei(this.tx.gasPrice, 'gwei')} gwei is too low, increasing and retrying`)
      this._increaseGasPrice()
      return this._send()
    }

    if (this._hasError(e.message, sameTxErrors)) {
      console.log('Same transaction is already in mempool, skipping submit')
      // do nothing
    }
  }

  /**
   * Returns whether error message is contained in errors array
   *
   * @param message The message to look up
   * @param {Array<string|RegExp>} errors Array with errors. Errors can be either string or regexp.
   * @returns {boolean} Returns true if error message is present in the `errors` array
   * @private
   */
  _hasError(message, errors) {
    return errors.find(e => typeof e === 'string' ? e === message : message.match(e)) !== undefined
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
    console.log(`Increasing gas price to ${fromWei(this.tx.gasPrice, 'gwei')} gwei`)
    return true
  }

  /**
   * Fetches gas price from the oracle
   *
   * @param {'instant'|'fast'|'normal'|'slow'} type
   * @returns {Promise<string>} A hex string representing gas price in wei
   * @private
   */
  async _getGasPrice(type) {
    const gasPrices = await this._gasPriceOracle.gasPrices()
    const result = gasPrices[type].toString()
    console.log(`${type} gas price is now ${result} gwei`)
    return toHex(toWei(gasPrices[type].toString(), 'gwei'))
  }

  /**
   * Gets current nonce for the current account, ignoring any pending transactions
   *
   * @returns {Promise<number>}
   * @private
   */
  _getLastNonce() {
    return this._web3.eth.getTransactionCount(this.address, 'latest')
  }
}

module.exports = TxManager
