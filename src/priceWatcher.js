const Redis = require('ioredis')
const { redisUrl, oracleAddress, oracleRpcUrl } = require('./config')
const { getArgsForOracle, setSafeInterval } = require('./utils')
const redis = new Redis(redisUrl)
const Web3 = require('web3')
const web3 = new Web3(oracleRpcUrl)

const priceOracleABI = require('../abis/PriceOracle.abi.json')
const oracle = new web3.eth.Contract(priceOracleABI, oracleAddress)
const { tokenAddresses, oneUintAmount, currencyLookup } = getArgsForOracle()

async function main() {
  const prices = await oracle.methods.getPricesInETH(tokenAddresses, oneUintAmount).call()
  const ethPrices = prices.reduce((acc, price, i) => {
    acc[currencyLookup[tokenAddresses[i]]] = price
    return acc
  }, {})
  await redis.hmset('prices', ethPrices)
  console.log('Wrote following prices to redis', ethPrices)
}

setSafeInterval(main, 30 * 1000)
