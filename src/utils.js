const { isHexStrict, toBN, toWei, BN } = require('web3-utils')
const { netId, mixers, relayerServiceFee } = require('../config')

function isValidProof(proof) {
  // validator expects `websnarkUtils.toSolidityInput(proof)` output

  if (!proof) {
    return { valid: false, reason: 'The proof is empty.' }
  }

  if (!isHexStrict(proof) || proof.length !== 2 + 2 * 8 * 32) {
    return { valid: false, reason: 'Corrupted proof' }
  }

  return { valid: true }
}

function isValidArgs(args) {
  if (!args) {
    return { valid: false, reason: 'Args are empty' }
  }

  if (args.length !== 6) {
    return { valid: false, reason: 'Length of args is lower than 6' }
  }

  for (let signal of args) {
    if (!isHexStrict(signal)) {
      return { valid: false, reason: `Corrupted signal ${signal}` }
    }
  }

  if (
    args[0].length !== 66 ||
    args[1].length !== 66 ||
    args[2].length !== 42 ||
    args[3].length !== 42 ||
    args[4].length !== 66 ||
    args[5].length !== 66
  ) {
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
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fromDecimals(value, decimals) {
  value = value.toString()
  let ether = value.toString()
  const base = new BN('10').pow(new BN(decimals))
  const baseLength = base.toString(10).length - 1 || 1

  const negative = ether.substring(0, 1) === '-'
  if (negative) {
    ether = ether.substring(1)
  }

  if (ether === '.') {
    throw new Error('[ethjs-unit] while converting number ' + value + ' to wei, invalid value')
  }

  // Split it into a whole and fractional part
  const comps = ether.split('.')
  if (comps.length > 2) {
    throw new Error('[ethjs-unit] while converting number ' + value + ' to wei,  too many decimal points')
  }

  let whole = comps[0]
  let fraction = comps[1]

  if (!whole) {
    whole = '0'
  }
  if (!fraction) {
    fraction = '0'
  }
  if (fraction.length > baseLength) {
    throw new Error('[ethjs-unit] while converting number ' + value + ' to wei, too many decimal places')
  }

  while (fraction.length < baseLength) {
    fraction += '0'
  }

  whole = new BN(whole)
  fraction = new BN(fraction)
  let wei = whole.mul(base).add(fraction)

  if (negative) {
    wei = wei.mul(negative)
  }

  return new BN(wei.toString(10), 10)
}

function isEnoughFee({ gas, gasPrices, currency, amount, refund, ethPrices, fee }) {
  const { decimals } = mixers[`netId${netId}`][currency]
  const decimalsPoint =
    Math.floor(relayerServiceFee) === relayerServiceFee
      ? 0
      : relayerServiceFee.toString().split('.')[1].length

  const roundDecimal = 10 ** decimalsPoint
  const feePercent = toBN(fromDecimals(amount, decimals))
    .mul(toBN(relayerServiceFee * roundDecimal))
    .div(toBN(roundDecimal * 100))
  const expense = toBN(toWei(gasPrices.fast.toString(), 'gwei')).mul(toBN(gas))
  let desiredFee
  switch (currency) {
    case 'eth': {
      desiredFee = expense.add(feePercent)
      break
    }
    default: {
      desiredFee = expense
        .add(refund)
        .mul(toBN(10 ** decimals))
        .div(toBN(ethPrices[currency]))
      desiredFee = desiredFee.add(feePercent)
      break
    }
  }
  console.log(
    'sent fee, desired fee, feePercent',
    fee.toString(),
    desiredFee.toString(),
    feePercent.toString()
  )
  if (fee.lt(desiredFee)) {
    return { isEnough: false, reason: 'Not enough fee' }
  }
  return { isEnough: true }
}

function getArgsForOracle() {
  const tokens = mixers['netId1']
  const tokenAddresses = []
  const oneUintAmount = []
  const currencyLookup = {}
  Object.entries(tokens).map(([currency, data]) => {
    if (currency !== 'eth') {
      tokenAddresses.push(data.tokenAddress)
      oneUintAmount.push(toBN('10').pow(toBN(data.decimals.toString())).toString())
      currencyLookup[data.tokenAddress] = currency
    }
  })
  return { tokenAddresses, oneUintAmount, currencyLookup }
}

function getMixers() {
  return mixers[`netId${netId}`]
}

module.exports = {
  isValidProof,
  isValidArgs,
  sleep,
  isKnownContract,
  isEnoughFee,
  getMixers,
  getArgsForOracle
}
