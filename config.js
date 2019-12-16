require('dotenv').config()

module.exports = {
  netId: Number(process.env.NET_ID) || 42,
  redisUrl: process.env.REDIS_URL,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixers: {
    netId1: {
      dai: {
        mixerAddress: {
          '100': undefined,
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18
      },
      eth: {
        mixerAddress: {
          '0.1': '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
          '1': undefined,
          '10': undefined,
          '100': undefined
        },
        decimals: 18
      }
    },
    netId42: {
      dai: {
        mixerAddress: {
          '100': '0x5D4538D2b07cD8Eb7b93c33B327f3E01A42e68d8',
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0x8c158c7e57161dd4d3cb02bf1a3a97fcc78b75fd',
        decimals: 18
      },
      eth: {
        mixerAddress: {
          '0.1': '0xB7F60Bf8b969CE4B95Bb50a671860D99478C81Ee',
          '1': '0x27e94B8cfa33EA2b47E209Ba69804d44642B3545',
          '10': undefined,
          '100': undefined
        },
        decimals: 18
      }
    }
  },
  defaultGasPrice: 2,
  gasOracleUrls: ['https://ethgasstation.info/json/ethgasAPI.json', 'https://gasprice.poa.network/'],
  port: process.env.APP_PORT,
  relayerServiceFee: Number(process.env.RELAYER_FEE)
}