const { v4: uuid } = require('uuid')
const Queue = require('bull')
const Redis = require('ioredis')
const { redisUrl } = require('./config')
const { status } = require('./constants')
const redis = new Redis(redisUrl)

const queue = new Queue('proofs', redisUrl, {
  lockDuration: 300000, // Key expiration time for job locks.
  lockRenewTime: 30000, // Interval on which to acquire the job lock
  stalledInterval: 30000, // How often check for stalled jobs (use 0 for never checking).
  maxStalledCount: 3, // Max amount of times a stalled job will be re-processed.
  guardInterval: 5000, // Poll interval for delayed jobs and added jobs.
  retryProcessDelay: 5000, // delay before processing next job in case of internal error.
  drainDelay: 5, // A timeout for when the queue is in drained state (empty waiting for jobs).
})

async function postJob({ type, request }) {
  const id = uuid()

  const job = await queue.add(
    {
      id,
      type,
      status: status.QUEUED,
      ...request, // proof, args, ?contract
    },
    {
      //removeOnComplete: true
    },
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
  if (!job) {
    return null
  }
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
