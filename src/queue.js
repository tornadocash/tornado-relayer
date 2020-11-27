const { v4: uuid } = require('uuid')
const Queue = require('bull')
const Redis = require('ioredis')
const { redisUrl } = require('./config')
const { status } = require('./constants')
const redis = new Redis(redisUrl)

const queue = new Queue('proofs', redisUrl)

async function postJob({ type, request }) {
  const id = uuid()

  const job = await queue.add(
    {
      id,
      type,
      status: status.QUEUED,
      ...request, // proof, args, ?contract
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
  return {
    ...job.data,
    failedReason: job.failedReason,
  }
}

module.exports = {
  postJob,
  getJob,
  getJobStatus,
  queue,
}
