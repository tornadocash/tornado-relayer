const { redisUrl } = require('../config')
const Redis = require('ioredis')
const redisClient = new Redis(redisUrl)
const subscriber = new Redis(redisUrl)

const redisOpts = {
  createClient: function (type) {
    switch (type) {
      case 'client':
        return redisClient
      case 'subscriber':
        return subscriber
      default:
        return new Redis(redisUrl)
    }
  }
}

module.exports = { redisOpts, redisClient }
