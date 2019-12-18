require('dotenv').config()

module.exports = {
  version: '1.0',
  netId: Number(process.env.NET_ID) || 42,
  redisUrl: process.env.REDIS_URL,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixers: {
    netId1: {
      dai: {
        mixerAddress: {
          '100': '0xD4B88Df4D29F5CedD6857912842cff3b20C8Cfa3',
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18
      },
      usdc: {
        mixerAddress: {
          '100': undefined,
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6
      },
      eth: {
        mixerAddress: {
          '0.1': '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
          '1': '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936',
          '10': '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF',
          '100': undefined
        },
        decimals: 18
      }
    },
    netId42: {
      dai: {
        mixerAddress: {
          '100': '0x7832f65F4030113C007538f29AbC6C13241d4478',
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0x8c158c7e57161dd4d3cb02bf1a3a97fcc78b75fd',
        decimals: 18
      },
      usdc: {
        mixerAddress: {
          '100': '0x42d096a9194a18DAA2d2D95a70D8dA80DeFFB645',
          '500': undefined,
          '1000': undefined,
          '5000': undefined
        },
        tokenAddress: '0x7f5939049c0D7D7dFC484f64600c9306F79a0D3F',
        decimals: 6
      },
      eth: {
        mixerAddress: {
          '0.1': '0x8b3f5393bA08c24cc7ff5A66a832562aAB7bC95f',
          '1': '0xD6a6AC46d02253c938B96D12BE439F570227aE8E',
          '10': '0xe1BE96331391E519471100c3c1528B66B8F4e5a7',
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