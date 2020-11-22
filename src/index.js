const express = require('express')
const {
  netId,
  port,
  relayerServiceFee,
  gasBumpPercentage,
  pendingTxTimeout,
  watherInterval,
  maxGasPrice
} = require('../config')
const relayController = require('./relayController')
const { fetcher, web3, gasPriceOracle } = require('./instances')
const { getMixers } = require('./utils')
const mixers = getMixers()
const { redisClient } = require('./redis')
const { version } = require('../package.json')
const app = express()
app.use(express.json())

app.use((err, req, res, next) => {
  if (err) {
    console.log('Invalid Request data')
    res.send('Invalid Request data')
  } else {
    next()
  }
})

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', function (req, res) {
  // just for testing purposes
  res.send(
    'This is <a href=https://tornado.cash>tornado.cash</a> Relayer service. Check the <a href=/status>/status</a> for settings'
  )
})

app.get('/status', async function (req, res) {
  let nonce = await redisClient.get('nonce')
  let latestBlock = null
  try {
    latestBlock = await web3.eth.getBlockNumber()
  } catch (e) {
    console.error('Problem with RPC', e)
  }
  const { ethPrices } = fetcher
  res.json({
    relayerAddress: web3.eth.defaultAccount,
    mixers,
    gasPrices: await gasPriceOracle.gasPrices(),
    netId,
    ethPrices,
    relayerServiceFee,
    nonce,
    version,
    latestBlock
  })
})

app.post('/relay', relayController)
console.log('Version:', version)
let server = app.listen(port || 8000)
server.setTimeout(600000)
console.log('Gas price oracle started.')
fetcher.fetchPrices()
fetcher.fetchNonce()

console.log('Relayer started on port', port || 8000)
console.log(`relayerAddress: ${web3.eth.defaultAccount}`)
console.log(`mixers: ${JSON.stringify(mixers)}`)
console.log(`netId: ${netId}`)
console.log(`ethPrices: ${JSON.stringify(fetcher.ethPrices)}`)

const {
  GAS_PRICE_BUMP_PERCENTAGE,
  ALLOWABLE_PENDING_TX_TIMEOUT,
  NONCE_WATCHER_INTERVAL,
  MAX_GAS_PRICE
} = process.env
if (!NONCE_WATCHER_INTERVAL) {
  console.log(`NONCE_WATCHER_INTERVAL is not set. Using default value ${watherInterval / 1000} sec`)
}

if (!GAS_PRICE_BUMP_PERCENTAGE) {
  console.log(`GAS_PRICE_BUMP_PERCENTAGE is not set. Using default value ${gasBumpPercentage}%`)
}

if (!ALLOWABLE_PENDING_TX_TIMEOUT) {
  console.log(`ALLOWABLE_PENDING_TX_TIMEOUT is not set. Using default value ${pendingTxTimeout / 1000} sec`)
}

if (!MAX_GAS_PRICE) {
  console.log(`MAX_GAS_PRICE is not set. Using default value ${maxGasPrice} Gwei`)
}
