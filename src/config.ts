import { RelayerJobType } from './types';
import tornConfig, { availableIds } from 'torn-token';

require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';
export const relayerVersion = require(`${isProduction ? '.' : '..'}/package.json`).version;
export const netId = <availableIds>Number(process.env.NET_ID || 1);
export const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const rpcUrl = process.env.HTTP_RPC_URL;
export const CONFIRMATIONS = Number(process.env.CONFIRMATIONS) || 4;
export const MAX_GAS_PRICE = Number(process.env.MAX_GAS_PRICE) || 1000;
export const BASE_FEE_RESERVE_PERCENTAGE = Number(process.env.BASE_FEE_RESERVE_PERCENTAGE) || 25;
export const mainnetRpcUrl = process.env.ORACLE_RPC_URL || 'https://mainnet.infura.io/';
export const offchainOracleAddress = '0x07D91f5fb9Bf7798734C3f606dB065549F6893bb';
export const multiCallAddress = '0xda3c19c6fe954576707fa24695efb830d9cca1ca';
export const aggregatorAddress = process.env.AGGREGATOR;
export const privateKey = process.env.PRIVATE_KEY;
export const instances = tornConfig.instances;
export const torn = tornConfig;
export const port = process.env.APP_PORT || 8000;
export const host = isProduction ? 'https://' + process.env.VIRTUAL_HOST : `http://localhost:${port}`;
export const tornadoServiceFee = Number(process.env.REGULAR_TORNADO_WITHDRAW_FEE);
export const rewardAccount = process.env.REWARD_ACCOUNT;
export const governanceAddress = '0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce';
export const tornadoGoerliProxy = '0x454d870a72e29d5E5697f635128D18077BD04C60';
export const gasLimits = {
  [RelayerJobType.TORNADO_WITHDRAW]: 390000,
  WITHDRAW_WITH_EXTRA: 700000,
  [RelayerJobType.MINING_REWARD]: 455000,
  [RelayerJobType.MINING_WITHDRAW]: 400000,
};
export const minimumBalance = '1000000000000000000';
export const minimumTornBalance = '30000000000000000000';
export const baseFeeReserve = Number(process.env.BASE_FEE_RESERVE_PERCENTAGE);
export const tornToken = {
  tokenAddress: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
  symbol: 'TORN',
  decimals: 18,
};

export const networkConfig = {
  netId56: {
    gasPrices: {
      instant: 5,
      fast: 5,
      standard: 5,
      low: 5,
    },
    nativeCurrency: 'bnb',
  },
  netId10: {
    gasPrices: {
      instant: 0.001,
      fast: 0.001,
      standard: 0.001,
      low: 0.001,
    },
    nativeCurrency: 'eth',
  },
  netId100: {
    gasPrices: {
      instant: 6,
      fast: 5,
      standard: 4,
      low: 1,
    },
    nativeCurrency: 'xdai',
  },
  netId137: {
    gasPrices: {
      instant: 100,
      fast: 75,
      standard: 50,
      low: 30,
    },
    nativeCurrency: 'matic',
  },
  netId42161: {
    gasPrices: {
      instant: 4,
      fast: 3,
      standard: 2.52,
      low: 2.29,
    },
    nativeCurrency: 'eth',
  },
  netId43114: {
    gasPrices: {
      instant: 225,
      fast: 35,
      standard: 25,
      low: 25,
    },
    nativeCurrency: 'avax',
  },
};
