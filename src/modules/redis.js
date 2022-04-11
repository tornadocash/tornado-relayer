const { createClient } = require('ioredis')
const { redisUrl } = require('../config')

const redis = createClient(redisUrl)

module.exports = {
  redis,
  redisUrl,
}
