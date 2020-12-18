const express = require('express')
const status = require('./status')
const controller = require('./controller')
const { port, rewardAccount } = require('./config')
const { version } = require('../package.json')
const { isAddress } = require('web3-utils')

const app = express()
app.use(express.json())

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Log error to console but don't send it to the client to avoid leaking data
app.use((err, req, res, next) => {
  if (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  next()
})

app.get('/', status.index)
app.get('/v1/status', status.status)
app.get('/v1/jobs/:id', status.getJob)
app.post('/v1/tornadoWithdraw', controller.tornadoWithdraw)
app.get('/status', status.status)
app.post('/relay', controller.tornadoWithdraw)
app.post('/v1/miningReward', controller.miningReward)
app.post('/v1/miningWithdraw', controller.miningWithdraw)

if (!isAddress(rewardAccount)) {
  throw new Error('No REWARD_ACCOUNT specified')
}

app.listen(port)
console.log(`Relayer ${version} started on port ${port}`)
