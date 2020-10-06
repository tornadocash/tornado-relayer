const queue = require('./queue')
const { netId, tornadoServiceFee, miningServiceFee, instances, redisUrl, rewardAccount } = require('./config')
const { version } = require('../package.json')
const Redis = require('ioredis')
const redis = new Redis(redisUrl)

async function status(req, res) {
  const ethPrices = await redis.hgetall('prices')
  res.json({
    rewardAccount,
    instances: instances[`netId${netId}`],
    netId,
    ethPrices,
    tornadoServiceFee,
    miningServiceFee,
    version,
  })
}

function index(req, res) {
  res.send(
    'This is <a href=https://tornado.cash>tornado.cash</a> Relayer service. Check the <a href=/v1/status>/status</a> for settings',
  )
}

async function getJob(req, res) {
  const status = await queue.getJobStatus(req.params.id)
  return res.json(status)
}

module.exports = {
  status,
  index,
  getJob,
}
