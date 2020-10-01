const { v4: uuid } = require('uuid')
const Queue = require('bull')
const Redis = require('ioredis')
const { redisUrl } = require('../config')
const redis = new Redis(redisUrl)

const queue = new Queue('proofs', redisUrl)

async function postJob({ type, data }) {
  const id = uuid()

  const job = await queue.add(
    {
      id,
      type,
      data,
    },
    // { removeOnComplete: true },
  )
  await redis.set(`job:${id}`, job.id)
  return id
}

async function getJob(uuid) {
  const id = await redis.get(`job:${uuid}`)
  return queue.getJobFromId(id)
}

async function getJobStatus(uuid) {
  const job = await getJob(uuid)
  return job.data
}

module.exports = {
  postJob,
  getJob,
  getJobStatus,
  queue,
}
