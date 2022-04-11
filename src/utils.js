const { instances } = require('./config')
const { toChecksumAddress, BN } = require('web3-utils')

function getInstance(address) {
  address = toChecksumAddress(address)
  for (const currency of Object.keys(instances)) {
    for (const amount of Object.keys(instances[currency].instanceAddress)) {
      if (instances[currency].instanceAddress[amount] === address) {
        return { currency, amount }
      }
    }
  }
  return null
}

function setSafeInterval(func, interval) {
  func()
    .catch(console.error)
    .finally(() => {
      setTimeout(() => setSafeInterval(func, interval), interval)
    })
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

const logRelayerError = async (redis, e) => {
  await redis.zadd('errors', 'INCR', 1, e.message)
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
  fromDecimals,
  logRelayerError,
  readRelayerErrors,
}
