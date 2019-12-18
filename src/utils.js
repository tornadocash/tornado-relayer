const { isHexStrict, toBN, toWei } = require('web3-utils')
const { netId, mixers, relayerServiceFee } = require('../config')

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
  const mixers = getMixers()
  for (let currency of Object.keys(mixers)) {
    for (let amount of Object.keys(mixers[currency].mixerAddress)) {
      if (mixers[currency].mixerAddress[amount] === contract) {
        return { valid: true, currency, amount }
      }
    }
  }
  return { valid: false }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isEnoughFee({ gas, gasPrices, currency, amount, refund, ethPrices, fee }) {
  // TODO tokens can have less then 18 decimals
  const feePercent = toBN(toWei(amount)).mul(toBN(relayerServiceFee * 10)).div(toBN('1000'))
  const expense = toBN(toWei(gasPrices.fast.toString(), 'gwei')).mul(toBN(gas))
  let desiredFee
  switch (currency) {
    case 'eth': {
      desiredFee = expense.add(feePercent)
      break
    }
    case 'dai': {
      desiredFee = 
        expense.add(refund)
          .mul(toBN(10 ** 18))
          .div(toBN(ethPrices.dai))
      desiredFee = desiredFee.add(feePercent)
      break
    }
  }
  console.log('desired fee, feePercent', desiredFee.toString(), feePercent.toString())
  if (fee.lt(desiredFee)) {
    return { isEnough: false, reason: 'Not enough fee' }
  } 
  return { isEnough: true }
}

function getMainnetTokens() {
  const tokens = mixers['netId1']
  const tokenAddresses = []
  const currencyLookup = {}
  Object.entries(tokens).map(([currency, data]) => {
    if (currency !== 'eth') {
      tokenAddresses.push(data.tokenAddress)
      currencyLookup[data.tokenAddress.toLowerCase()] = currency
    }
  })
  return { tokenAddresses, currencyLookup }
}

function getMixers() {
  return mixers[`netId${netId}`]
}

module.exports = { isValidProof, isValidArgs, sleep, isKnownContract, isEnoughFee, getMixers, getMainnetTokens }
