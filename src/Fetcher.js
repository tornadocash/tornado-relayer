const CoinGecko = require('coingecko-api') 
const fetch = require('node-fetch')
const { toWei } = require('web3-utils')
const { gasOracleUrls, defaultGasPrice } = require('../config')
const { getMainnetTokens } = require('./utils')
const config = require ('../config')
 

class Fetcher {
  constructor(web3) {
    this.web3 = web3
    this.ethPrices = {
      dai: '6700000000000000' // 0.0067
    }
    this.gasPrices = {
      fast: defaultGasPrice
    }
  }
  async fetchPrices() {
    const { tokenAddresses, currencyLookup } = getMainnetTokens()
    try {
      const CoinGeckoClient = new CoinGecko()
      const price = await CoinGeckoClient.simple.fetchTokenPrice({
        contract_addresses: tokenAddresses,
        vs_currencies: 'eth',
        assetPlatform: 'ethereum'
      })
      this.ethPrices = Object.entries(price.data).reduce((acc, token) => {
        if (token[1].eth) {
          acc[currencyLookup[token[0]]] = toWei(token[1].eth.toString())
        }
        return acc
      }, {})
      setTimeout(() => this.fetchPrices(), 1000 * 30)
    } catch(e) {
      setTimeout(() => this.fetchPrices(), 1000 * 30)
    }
  }
  async fetchGasPrice({ oracleIndex = 0 } = {}) {
    oracleIndex = (oracleIndex + 1) % gasOracleUrls.length
    try {
      const response = await fetch(gasOracleUrls[oracleIndex])
      if (response.status === 200) {
        const json = await response.json()
  
        if (json.slow) {
          this.gasPrices.low = Number(json.slow)
        }
        if (json.safeLow) {
          this.gasPrices.low = Number(json.safeLow)
        }
        if (json.standard) {
          this.gasPrices.standard = Number(json.standard)
        }
        if (json.fast) {
          this.gasPrices.fast = Number(json.fast)
        }
      } else {
        throw Error('Fetch gasPrice failed')
      }
      setTimeout(() => this.fetchGasPrice({ oracleIndex }), 15000)
    } catch (e) {
      setTimeout(() => this.fetchGasPrice({ oracleIndex }), 15000)
    }
  }
  async fetchNonce() {
    try {
      config.nonce = await this.web3.eth.getTransactionCount(this.web3.eth.defaultAccount)
      console.log(`Current nonce: ${config.nonce}%`)
    } catch(e) {
      console.error('fetchNonce failed', e.message)
      setTimeout(this.fetchNonce, 3000)
    }
  }
}

module.exports = Fetcher
