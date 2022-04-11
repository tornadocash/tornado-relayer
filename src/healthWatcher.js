const Web3 = require('web3')
const { toBN, fromWei } = require('web3-utils')
const { setSafeInterval } = require('./utils')
const { httpRpcUrl, privateKey, minimumBalance, nativeCurrency, instances } = require('./config')

const web3 = new Web3(httpRpcUrl)
const { redis } = require('./modules/redis')

async function main() {
  try {
    const { address } = web3.eth.accounts.privateKeyToAccount(privateKey)
    const balance = await web3.eth.getBalance(address)

    if (toBN(balance).lt(toBN(minimumBalance))) {
      const currency = instances[nativeCurrency].symbol
      throw new Error(`Not enough balance, less than ${fromWei(minimumBalance)} ${currency}`)
    }

    await redis.hset('health', { status: true, error: '' })
  } catch (e) {
    console.error('healthWatcher', e.message)
    await redis.hset('health', { status: false, error: e.message })
  }
}

setSafeInterval(main, 30 * 1000)
