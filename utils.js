const fetch = require('node-fetch')
const { isHexStrict } = require('web3-utils')
const { gasOracleUrls } = require('./config')

async function fetchGasPrice({ gasPrices, oracleIndex = 0 }) {
  oracleIndex = (oracleIndex + 1) % gasOracleUrls.length
  try {
    const response = await fetch(gasOracleUrls[oracleIndex])
    if (response.status === 200) {
      const json = await response.json()
      if (Number(json.fast) === 0) {      
        throw Error('Fetch gasPrice failed')
      }

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

function isValidProof(proof) {
  // validator expects `websnarkUtils.toSolidityInput(proof)` output

  if (!(proof.pi_a && proof.pi_b && proof.pi_c && proof.publicSignals)) {
    return { valid: false, reason: 'One of inputs is empty. There must be pi_a, pi_b, pi_c and publicSignals' }
  }

  Object.keys(proof).forEach(key => {
    if (!Array.isArray(proof[key])) {
      return { valid: false, reason: `Corrupted ${key}` }
    }
    if (key === 'pi_b') {
      if (!Array.isArray(proof[key][0]) || !Array.isArray(proof[key][1])) {
        return { valid: false, reason: `Corrupted ${key}` }
      }
    }
  })

  if (proof.pi_a.length !== 2) {
    return { valid: false, reason: 'Corrupted pi_a' }
  }

  if (proof.pi_b.length !== 2 || proof.pi_b[0].length !== 2 || proof.pi_b[1].length !== 2) {
    return { valid: false, reason: 'Corrupted pi_b' }
  }

  if (proof.pi_c.length !== 2) {
    return { valid: false, reason: 'Corrupted pi_c' }
  }

  if (proof.publicSignals.length !== 4) {
    return { valid: false, reason: 'Corrupted publicSignals' }
  }

  for (let [key, input] of Object.entries(proof)) {
    if (key === 'pi_b') {
      input = input[0].concat(input[1])
    }

    for (let i = 0; i < input.length; i++ ) {
      if (!isHexStrict(input[i]) || input[i].length !== 66) {
        return { valid: false, reason: `Corrupted ${key}` }
      }
    }
  }
  return { valid: true }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { fetchGasPrice, isValidProof, sleep }
