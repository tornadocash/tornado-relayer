const Web3 = require('web3')
const { defaultGasPrice, oracleRpcUrl, oracleAddress } = require('../config')
const { getArgsForOracle } = require('./utils')
const { redisClient } = require('./redis')
const priceOracleABI = require('../abis/PriceOracle.abi.json')

class Fetcher {
  constructor(web3) {
    this.web3 = web3
    this.oracleWeb3 = new Web3(oracleRpcUrl)
    this.oracle = new this.oracleWeb3.eth.Contract(priceOracleABI, oracleAddress)
    this.ethPrices = {
      dai: '6700000000000000', // 0.0067
      cdai: '157380000000000',
      cusdc: '164630000000000',
      usdc: '7878580000000000',
      usdt: '7864940000000000'
    }
    this.tokenAddresses
    this.oneUintAmount
    this.currencyLookup
    this.gasPrices = {
      fast: defaultGasPrice
    }

    const { tokenAddresses, oneUintAmount, currencyLookup } = getArgsForOracle()
    this.tokenAddresses = tokenAddresses
    this.oneUintAmount = oneUintAmount
    this.currencyLookup = currencyLookup
  }
  async fetchPrices() {
    try {
      let prices = await this.oracle.methods.getPricesInETH(this.tokenAddresses, this.oneUintAmount).call()
      this.ethPrices = prices.reduce((acc, price, i) => {
        acc[this.currencyLookup[this.tokenAddresses[i]]] = price
        return acc
      }, {})
      setTimeout(() => this.fetchPrices(), 1000 * 30)
    } catch (e) {
      console.error('fetchPrices', e.message)
      setTimeout(() => this.fetchPrices(), 1000 * 30)
    }
  }
  async fetchNonce() {
    try {
      const nonce = await this.web3.eth.getTransactionCount(this.web3.eth.defaultAccount)
      await redisClient.set('nonce', nonce)
      console.log(`Current nonce: ${nonce}`)
    } catch (e) {
      console.error('fetchNonce failed', e.message)
      setTimeout(this.fetchNonce, 3000)
    }
  }
}

module.exports = Fetcher
