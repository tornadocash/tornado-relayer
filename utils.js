const fetch = require('node-fetch')
const { isHexStrict, hexToNumberString } = require('web3-utils')
const { gasOracleUrls, ethdaiAddress, mixers } = require('./config')
const oracleABI = require('./abis/ETHDAIOracle.json')

async function fetchGasPrice({ gasPrices, oracleIndex = 0 }) {
  oracleIndex = (oracleIndex + 1) % gasOracleUrls.length
  try {
    const response = await fetch(gasOracleUrls[oracleIndex])
    if (response.status === 200) {
      const json = await response.json()

      if (json.slow) {
        gasPrices.low = Number(json.slow)
      }
      if (json.safeLow) {
        gasPrices.low = Number(json.safeLow)
      }
      if (json.standard) {
        gasPrices.standard = Number(json.standard)
      }
      if (json.fast) {
        gasPrices.fast = Number(json.fast)
      }
    } else {
      throw Error('Fetch gasPrice failed')
    }
    setTimeout(() => fetchGasPrice({ gasPrices, oracleIndex }), 15000)
  } catch (e) {
    setTimeout(() => fetchGasPrice({ gasPrices, oracleIndex }), 15000)
  }
}

async function fetchDAIprice({ ethPriceInDai, web3 }) {
  try {
    const ethDaiInstance = web3.eth.Contract(oracleABI, ethdaiAddress)
    const price = await ethDaiInstance.methods.getMedianPrice().call()
    ethPriceInDai = hexToNumberString(price)
    setTimeout(() => fetchDAIprice({ ethPriceInDai, web3 }), 1000 * 30)
  } catch(e) {
    setTimeout(() => fetchDAIprice({ ethPriceInDai, web3 }), 1000 * 30)
  }
}

function isValidProof(proof) {
  // validator expects `websnarkUtils.toSolidityInput(proof)` output

  if (!(proof.proof && proof.publicSignals)) {
    return { valid: false, reason: 'One of inputs is empty. There must be proof and publicSignals' }
  }

  Object.keys(proof).forEach(key => {
    if (!Array.isArray(proof[key])) {
      return { valid: false, reason: `Corrupted ${key}` }
    }
  })

  if (proof.proof.length !== 8) {
    return { valid: false, reason: 'Corrupted proof' }
  }

  if (proof.publicSignals.length !== 6) {
    return { valid: false, reason: 'Corrupted publicSignals' }
  }

  for (let [key, input] of Object.entries(proof)) {
    for (let i = 0; i < input.length; i++ ) {
      if (!isHexStrict(input[i]) || input[i].length !== 66) {
        return { valid: false, reason: `Corrupted ${key}` }
      }
    }
  }
  return { valid: true }
}

function isKnownContract(contract) {
  for (let i = 0; i < mixers.length; i++) {
    if (mixers[i].address === contract) {
      return { valid: true, currency: mixers[i].currency }
    }
  }
  return { valid: false }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { fetchGasPrice, isValidProof, sleep, fetchDAIprice, isKnownContract }
