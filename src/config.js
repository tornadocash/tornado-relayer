require('dotenv').config()

const jobType = require('./jobTypes')

module.exports = {
  netId: Number(process.env.NET_ID) || 42,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  httpRpcUrl: process.env.HTTP_RPC_URL,
  wsRpcUrl: process.env.WS_RPC_URL,
  oracleRpcUrl: process.env.ORACLE_RPC_URL || 'https://mainnet.infura.io/',
  oracleAddress: '0xA2b8E7ee7c8a18ea561A5CF7C9C365592026E374',
  minerAddress: '0x3E0a9C6Cf76136862De28ce25a56cDBF38EF9D37', // each network has its own instance
  tornadoProxyAddress: '0x98529F6FaE5AdaFfa0AaDA37d9017AF9a4281E13', // each network has its own instance
  swapAddress: '0x1E73e0a484a595B692f3d212642AE4B3BF30E7e3',
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
