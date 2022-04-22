const { offchainOracleAddress } = require('./config')
const {
  getArgsForOracle,
  setSafeInterval,
  toChecksumAddress,
  toBN,
  RelayerError,
  logRelayerError,
} = require('./utils')
const { redis } = require('./modules/redis')
const web3 = require('./modules/web3')('oracle')

const offchainOracleABI = require('../abis/OffchainOracle.abi.json')

const offchainOracle = new web3.eth.Contract(offchainOracleABI, offchainOracleAddress)
const { tokenAddresses, oneUintAmount, currencyLookup } = getArgsForOracle()

async function main() {
  try {
    const ethPrices = {}
    for (let i = 0; i < tokenAddresses.length; i++) {
      try {
        const isWrap =
          toChecksumAddress(tokenAddresses[i]) ===
          toChecksumAddress('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643')

        const price = await offchainOracle.methods.getRateToEth(tokenAddresses[i], isWrap).call()
        const numerator = toBN(oneUintAmount[i])
        const denominator = toBN(10).pow(toBN(18)) // eth decimals
        const priceFormatted = toBN(price).mul(numerator).div(denominator)
        ethPrices[currencyLookup[tokenAddresses[i]]] = priceFormatted.toString()
      } catch (e) {
        console.error('cant get price of ', tokenAddresses[i])
      }
    }
    if (!Object.values(ethPrices).length) {
      throw new RelayerError('Can`t update prices', 1)
    }
    await redis.hmset('prices', ethPrices)
    console.log('Wrote following prices to redis', ethPrices)
  } catch (e) {
    await logRelayerError(redis, e)
    console.error('priceWatcher error', e)
  }
}

setSafeInterval(main, 30 * 1000)
