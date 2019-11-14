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

function isValidProof(data) {
  // validator expects `websnarkUtils.toSolidityInput(proof)` output

  if (!(data.proof && data.publicSignals)) {
    return { valid: false, reason: 'One of inputs is empty. There must be proof and publicSignals' }
  }

  if (!isHexStrict(data.proof) || data.proof.length !== 2 + 2 * 8 * 32) {
    return { valid: false, reason: 'Corrupted proof' }
  }

  if (data.publicSignals.length !== 6) {
    return { valid: false, reason: 'Corrupted publicSignals' }
  }

  for(let signal of data.publicSignals) {
    if (!isHexStrict(signal)) {
      return { valid: false, reason: 'Corrupted publicSignals' }
    }
  }

  if (data.publicSignals[0].length !== 66 ||
      data.publicSignals[1].length !== 66 ||
      data.publicSignals[2].length !== 42 ||
      data.publicSignals[3].length !== 42 ||
      data.publicSignals[4].length !== 66 ||
      data.publicSignals[5].length !== 66) {
    return { valid: false, reason: 'Corrupted publicSignals' }
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
