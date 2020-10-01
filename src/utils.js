const { instances, netId } = require('../config')
const { poseidon } = require('circomlib')
const { toBN, toChecksumAddress } = require('web3-utils')

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

function getInstance(address) {
  address = toChecksumAddress(address)
  const inst = instances[`netId${netId}`]
  for (const currency of Object.keys(inst)) {
    for (const amount of Object.keys(inst[currency].instanceAddress)) {
      if (inst[currency].instanceAddress[amount] === address) {
        return { currency, amount }
      }
    }
  }
  return null
}

// async function setSafeInterval(func, interval) {
//   try {
//     await func()
//   } catch (e) {
//     console.error('Unhandled promise error:', e)
//   } finally {
//     setTimeout(() => setSafeInterval(func, interval), interval)
//   }
// }

const poseidonHash = (items) => toBN(poseidon(items).toString())
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
      .once(event, (payload) => {
        resolve(payload)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

module.exports = {
  getInstance,
  setSafeInterval,
  poseidonHash2,
  sleep,
  when,
}
