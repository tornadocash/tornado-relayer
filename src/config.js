require('dotenv').config()

const jobType = require('./jobTypes')

module.exports = {
  netId: Number(process.env.NET_ID) || 42,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  httpRpcUrl: process.env.HTTP_RPC_URL,
  wsRpcUrl: process.env.WS_RPC_URL,
  oracleRpcUrl: process.env.ORACLE_RPC_URL || 'https://mainnet.infura.io/',
  oracleAddress: '0xA2b8E7ee7c8a18ea561A5CF7C9C365592026E374',
  minerAddress: '0xB28038Cd60777aF2264F46C0009dC57975239B11', // each network has its own instance
  swapAddress: '0xec236719BEbfC1D303739FbE11Bf3a42aF1A41f4',
  minerMerkleTreeHeight: 20,
  privateKey: process.env.PRIVATE_KEY,
  instances: require('torn-token').instances,
  port: process.env.APP_PORT || 8000,
  tornadoServiceFee: Number(process.env.REGULAR_TORNADO_WITHDRAW_FEE),
  miningServiceFee: Number(process.env.MINING_SERVICE_FEE),
  tornEthPrice: process.env.TORN_ETH_PRICE || '7000000000000000',
  rewardAccount: process.env.REWARD_ACCOUNT,
  gasLimits: {
    [jobType.TORNADO_WITHDRAW]: 350000,
    [jobType.MINING_REWARD]: 800000,
    [jobType.MINING_WITHDRAW]: 800000,
  },
}
