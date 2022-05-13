import { jobType } from './types';
import tornConfig, { availableIds } from 'torn-token';

require('dotenv').config();

export const netId = <availableIds>Number(process.env.NET_ID || 1);
export const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const httpRpcUrl = process.env.HTTP_RPC_URL;
export const wsRpcUrl = process.env.WS_RPC_URL;
export const oracleRpcUrl = process.env.ORACLE_RPC_URL || 'https://mainnet.infura.io/';
export const offchainOracleAddress = '0x07D91f5fb9Bf7798734C3f606dB065549F6893bb';
export const multiCallAddress = '0xda3c19c6fe954576707fa24695efb830d9cca1ca';
export const aggregatorAddress = process.env.AGGREGATOR;
export const minerMerkleTreeHeight = 20;
export const privateKey = process.env.PRIVATE_KEY;
export const instances = tornConfig.instances;
export const torn = tornConfig;
export const port = process.env.APP_PORT || 8000;
export const tornadoServiceFee = Number(process.env.REGULAR_TORNADO_WITHDRAW_FEE);
export const miningServiceFee = Number(process.env.MINING_SERVICE_FEE);
export const rewardAccount = process.env.REWARD_ACCOUNT;
export const governanceAddress = '0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce';
export const tornadoGoerliProxy = '0x454d870a72e29d5E5697f635128D18077BD04C60';
export const gasLimits = {
  [jobType.TORNADO_WITHDRAW]: 390000,
  WITHDRAW_WITH_EXTRA: 700000,
  [jobType.MINING_REWARD]: 455000,
  [jobType.MINING_WITHDRAW]: 400000,
};
export const minimumBalance = '1000000000000000000';
export const baseFeeReserve = Number(process.env.BASE_FEE_RESERVE_PERCENTAGE);
export const tornToken = {
  tokenAddress: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
  symbol: 'TORN',
  decimals: 18,
};
