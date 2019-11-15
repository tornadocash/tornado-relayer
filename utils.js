const fetch = require('node-fetch')
const { isHexStrict, hexToNumberString, toBN, toWei } = require('web3-utils')
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

  if (!(proof)) {
    return { valid: false, reason: 'The proof is empty.' }
  }

  if (!isHexStrict(proof) || proof.length !== 2 + 2 * 8 * 32) {
    return { valid: false, reason: 'Corrupted proof' }
  }

  return { valid: true }
}

function isValidArgs(args) {

  if (!(args)) {
    return { valid: false, reason: 'Args are empty' }
  }

  if (args.length !== 6) {
    return { valid: false, reason: 'Length of args is lower than 6' }
  }

  for(let signal of args) {
    if (!isHexStrict(signal)) {
      return { valid: false, reason: `Corrupted signal ${signal}` }
    }
  }

  if (args[0].length !== 66 ||
      args[1].length !== 66 ||
      args[2].length !== 42 ||
      args[3].length !== 42 ||
      args[4].length !== 66 ||
      args[5].length !== 66) {
    return { valid: false, reason: 'The length one of the signals is incorrect' }
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

function isEnoughFee({ gas, gasPrices, currency, refund, ethPriceInDai, fee }) {
  const expense = toBN(toWei(gasPrices.fast.toString(), 'gwei')).mul(toBN(gas))
  let desiredFee
  switch (currency) {
    case 'eth': {
      desiredFee = expense
      break
    }
    case 'dai': {
      desiredFee = expense.add(refund).mul(toBN(ethPriceInDai)).div(toBN(10 ** 18))
      break
    }
  }
  if (fee.lt(desiredFee)) {
    return { isEnough: false, reason: 'Not enough fee' }
  } 
  return { isEnough: true }
}

module.exports = { fetchGasPrice, isValidProof, isValidArgs, sleep, fetchDAIprice, isKnownContract, isEnoughFee }
