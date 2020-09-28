const { getWithdrawInputError } = require('./validate')
const { postJob } = require('./queue')

async function tornadoWithdraw(req, res) {
  const inputError = getWithdrawInputError(req.body)
  if (inputError) {
    console.log('Invalid input:', inputError)
    return res.status(400).json({ error: inputError })
  }

  const { proof, args, contract } = req.body
  const id = await postJob({
    type: 'withdraw',
    data: { proof, args, contract },
  })
  return res.json({ id })
}

module.exports = {
  tornadoWithdraw,
}
