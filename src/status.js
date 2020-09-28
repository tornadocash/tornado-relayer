const queue = require('queue')

async function status(req, res) {
  let nonce = await redisClient.get('nonce')
  let latestBlock = null
  try {
    latestBlock = await web3.eth.getBlockNumber()
  } catch (e) {
    console.error('Problem with RPC', e)
  }
  const { ethPrices } = fetcher
  res.json({
    relayerAddress: web3.eth.defaultAccount,
    mixers,
    gasPrices: await gasPriceOracle.gasPrices(),
    netId,
    ethPrices,
    relayerServiceFee,
    nonce,
    version,
    latestBlock
  })
}

function index(req, res) {
  res.send('This is <a href=https://tornado.cash>tornado.cash</a> Relayer service. Check the <a href=/v1/status>/status</a> for settings')
}

async function getJob(req, res) {
  const status = await queue.getJobStatus(req.params.id)
  return res.send(status)
}

module.exports = {
  status,
  index,
  getJob,
}
