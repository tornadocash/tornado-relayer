const express = require('express')
const { netId, mixers, port, relayerServiceFee } = require('../config')
const relayController = require('./relayController')
const { fetcher, web3 } = require('./instances')

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

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', function (req, res) {
  // just for testing purposes
  res.send('This is <a href=https://tornado.cash>tornado.cash</a> Relayer service. Check the /status for settings')
})

app.get('/status', function (req, res) {
  const { ethPrices, gasPrices } = fetcher
  res.json({ relayerAddress: web3.eth.defaultAccount, mixers, gasPrices, netId, ethPrices, relayerServiceFee })
})

app.post('/relay', relayController)

app.listen(port || 8000)
console.log('Gas price oracle started.')
fetcher.fetchGasPrice()
fetcher.fetchPrices()

console.log('Relayer started on port', port || 8000)
console.log(`relayerAddress: ${web3.eth.defaultAccount}`)
console.log(`mixers: ${JSON.stringify(mixers)}`)
console.log(`gasPrices: ${JSON.stringify(fetcher.gasPrices)}`)
console.log(`netId: ${netId}`)
console.log(`ethPrices: ${JSON.stringify(fetcher.ethPrices)}`)
console.log(`Service fee: ${relayerServiceFee}%`)