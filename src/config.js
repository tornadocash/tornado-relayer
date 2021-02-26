require('dotenv').config()

const { jobType } = require('./constants')
const tornConfig = require('torn-token')
module.exports = {
  netId: Number(process.env.NET_ID) || 1,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  httpRpcUrl: process.env.HTTP_RPC_URL,
  wsRpcUrl: process.env.WS_RPC_URL,
  oracleRpcUrl: process.env.ORACLE_RPC_URL || 'https://mainnet.infura.io/',
  offchainOracleAddress: '0x080ab73787a8b13ec7f40bd7d00d6cc07f9b24d0',
  multiCallAddress: '0xda3c19c6fe954576707fa24695efb830d9cca1ca',
  aggregatorAddress: process.env.AGGREGATOR,
  minerMerkleTreeHeight: 20,
  privateKey: process.env.PRIVATE_KEY,
  instances: tornConfig.instances,
  torn: tornConfig,
  port: process.env.APP_PORT || 8000,
  tornadoServiceFee: Number(process.env.REGULAR_TORNADO_WITHDRAW_FEE),
  miningServiceFee: Number(process.env.MINING_SERVICE_FEE),
  rewardAccount: process.env.REWARD_ACCOUNT,
  gasLimits: {
    [jobType.TORNADO_WITHDRAW]: 350000,
    [jobType.MINING_REWARD]: 455000,
    [jobType.MINING_WITHDRAW]: 400000,
  },
  minimumBalance: '1000000000000000000',
}
