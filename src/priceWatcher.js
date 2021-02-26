const Redis = require('ioredis')
const { redisUrl, offchainOracleAddress, multiCallAddress, oracleRpcUrl } = require('./config')
const { getArgsForOracle, setSafeInterval } = require('./utils')
const redis = new Redis(redisUrl)
const Web3 = require('web3')
const web3 = new Web3(oracleRpcUrl)

const multiCallABI = require('../abis/MultiCall.abi.json')
const offchainOracleABI = require('../abis/OffchainOracle.abi.json')

const offchainOracle = new web3.eth.Contract(offchainOracleABI)
const multiCall = new web3.eth.Contract(multiCallABI, multiCallAddress)
const { tokenAddresses, oneUintAmount, currencyLookup } = getArgsForOracle()

const { toBN } = require('web3-utils')

async function main() {
  const callData = tokenAddresses.map(address => ({
    to: offchainOracleAddress,
    data: offchainOracle.methods
      .getRate(
        address,
        '0x0000000000000000000000000000000000000000', // rate to ETH
      )
      .encodeABI(),
  }))

  const { results, success } = await multiCall.methods.multicall(callData).call()

  const ethPrices = {}
  for (let i = 0; i < results.length; i++) {
    if (!success[i]) {
      continue
    }

    const decodedRate = web3.eth.abi.decodeParameter('uint256', results[i]).toString()
    const numerator = toBN(oneUintAmount[i])
    const denominator = toBN(10).pow(toBN(18)) // eth decimals
    const price = toBN(decodedRate).mul(numerator).div(denominator)

    ethPrices[currencyLookup[tokenAddresses[i]]] = price.toString()
  }

  await redis.hmset('prices', ethPrices)
  console.log('Wrote following prices to redis', ethPrices)
}

setSafeInterval(main, 30 * 1000)
