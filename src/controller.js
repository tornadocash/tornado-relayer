const {
  getTornadoWithdrawInputError,
  getMiningRewardInputError,
  getMiningWithdrawInputError,
} = require('./validator')
const { postJob } = require('./queue')

async function tornadoWithdraw(req, res) {
  const inputError = getTornadoWithdrawInputError(req.body)
  if (inputError) {
    console.log('Invalid input:', inputError)
    return res.status(400).json({ error: inputError })
  }

  const id = await postJob({
    type: 'tornadoWithdraw',
    data: req.body,
  })
  return res.json({ id })
}

async function miningReward(req, res) {
  const inputError = getMiningRewardInputError(req.body)
  if (inputError) {
    console.log('Invalid input:', inputError)
    return res.status(400).json({ error: inputError })
  }

  const id = await postJob({
    type: 'miningReward',
    data: req.body,
  })
  return res.json({ id })
}

async function miningWithdraw(req, res) {
  const inputError = getMiningWithdrawInputError(req.body)
  if (inputError) {
    console.log('Invalid input:', inputError)
    return res.status(400).json({ error: inputError })
  }

  const id = await postJob({
    type: 'miningWithdraw',
    data: req.body,
  })
  return res.json({ id })
}

module.exports = {
  tornadoWithdraw,
  miningReward,
  miningWithdraw,
}
