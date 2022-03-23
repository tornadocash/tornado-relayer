const express = require('express')
const { port, rewardAccount } = require('./config')
const { version } = require('../package.json')
const { isAddress } = require('./utils')
const router = require('./router')

if (!isAddress(rewardAccount)) {
  throw new Error('No REWARD_ACCOUNT specified')
}
const app = express()
app.use(express.json())
app.use(router)
app.listen(port)
console.log(`Relayer ${version} started on port ${port}`)
