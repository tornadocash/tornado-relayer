const { setSafeInterval, toBN, fromWei, RelayerError } = require('./utils')
const { privateKey, minimumBalance } = require('./config')
const { redis } = require('./modules/redis')
const web3 = require('./modules/web3')()

async function main() {
  try {
    const { address } = web3.eth.accounts.privateKeyToAccount(privateKey)
    const balance = await web3.eth.getBalance(address)
    if (toBN(balance).lt(toBN(minimumBalance))) {
      throw new RelayerError(`Not enough balance, less than ${fromWei(minimumBalance)} ETH`, 1)
    }

    await redis.hset('health', { status: true, error: '' })
  } catch (e) {
    console.error('healthWatcher', e.message)
    await redis.hset('health', { status: false, error: e.message })
  }
}

setSafeInterval(main, 30 * 1000)
