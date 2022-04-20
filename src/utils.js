const { instances, netId } = require('./config')
const { poseidon } = require('circomlib')
const { toBN, toChecksumAddress, BN, fromWei, isAddress, toWei } = require('web3-utils')

const TOKENS = {
  torn: {
    tokenAddress: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
    symbol: 'TORN',
    decimals: 18,
  },
}

const addressMap = new Map()
const instance = instances[`netId${netId}`]

for (const [currency, { instanceAddress, symbol, decimals }] of Object.entries(instance)) {
  Object.entries(instanceAddress).forEach(([amount, address]) =>
    addressMap.set(`${netId}_${address}`, {
      currency,
      amount,
      symbol,
      decimals,
    }),
  )
}

const sleep = ms => new Promise(res => setTimeout(res, ms))

function getInstance(address) {
  const key = `${netId}_${toChecksumAddress(address)}`
  if (addressMap.has(key)) {
    return addressMap.get(key)
  } else {
    throw new Error('Unknown contact address')
  }
}

const poseidonHash = items => toBN(poseidon(items).toString())
const poseidonHash2 = (a, b) => poseidonHash([a, b])

function setSafeInterval(func, interval) {
  func()
    .catch(console.error)
    .finally(() => {
      setTimeout(() => setSafeInterval(func, interval), interval)
    })
}

/**
 * A promise that resolves when the source emits specified event
 */
function when(source, event) {
  return new Promise((resolve, reject) => {
    source
      .once(event, payload => {
        resolve(payload)
      })
      .on('error', error => {
        reject(error)
      })
  })
}

function getArgsForOracle() {
  const tokens = {
    ...instances.netId1,
    ...TOKENS,
  }
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

class RelayerError extends Error {
  constructor(message, score = 0) {
    super(message)
    this.score = score
  }
}

const logRelayerError = async (redis, e) => {
  await redis.zadd('errors', 'INCR', e.score || 1, e.message)
}

const readRelayerErrors = async redis => {
  const set = await redis.zrevrange('errors', 0, -1, 'WITHSCORES')
  const errors = []
  while (set.length) {
    const [message, score] = set.splice(0, 2)
    errors.push({ message, score })
  }
  return errors
}

module.exports = {
  getInstance,
  setSafeInterval,
  poseidonHash2,
  sleep,
  when,
  getArgsForOracle,
  fromDecimals,
  toBN,
  toChecksumAddress,
  fromWei,
  toWei,
  BN,
  isAddress,
  RelayerError,
  logRelayerError,
  readRelayerErrors,
}
