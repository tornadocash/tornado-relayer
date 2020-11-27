const jobType = Object.freeze({
  TORNADO_WITHDRAW: 'TORNADO_WITHDRAW',
  MINING_REWARD: 'MINING_REWARD',
  MINING_WITHDRAW: 'MINING_WITHDRAW',
})

const status = Object.freeze({
  QUEUED: 'QUEUED',
  ACCEPTED: 'ACCEPTED',
  SENT: 'SENT',
  MINED: 'MINED',
  RESUBMITTED: 'RESUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
})

module.exports = {
  jobType,
  status,
}
