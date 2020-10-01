const queue = require('./queue')
const { GasPriceOracle } = require('gas-price-oracle')
const gasPriceOracle = new GasPriceOracle()
const { netId, relayerServiceFee, instances } = require('../config')
const { version } = require('../package.json')

async function status(req, res) {
  const ethPrices = {
    dai: '6700000000000000', // 0.0067
    cdai: '157380000000000',
    cusdc: '164630000000000',
    usdc: '7878580000000000',
    usdt: '7864940000000000',
  }
  res.json({
    relayerAddress: require('../config').rewardAccount,
    instances: instances.netId42,
    gasPrices: await gasPriceOracle.gasPrices(),
    netId,
    ethPrices,
    relayerServiceFee,
    nonce: 123,
    version,
    latestBlock: 12312312,
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
