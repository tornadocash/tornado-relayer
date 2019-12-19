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
      cusdc: {
        mixerAddress: {
          '5000': undefined,
          '50000': undefined,
          '100000': undefined,
          '500000': undefined
        },
        tokenAddress: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
        decimals: 8
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
          '100': '0xdf2d3cC5F361CF95b3f62c4bB66deFe3FDE47e3D',
          '1000': '0xD96291dFa35d180a71964D0894a1Ae54247C4ccD',
          '10000': '0xb192794f72EA45e33C3DF6fe212B9c18f6F45AE3',
          '100000': undefined
        },
        tokenAddress: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
        decimals: 18
      },
      usdc: {
        mixerAddress: {
          '100': '0x137E2B6d185018e7f09f6cf175a970e7fC73826C',
          '1000': '0xcC7f1633A5068E86E3830e692e3e3f8f520525Af',
          '10000': '0x28C8f149a0ab8A9bdB006B8F984fFFCCE52ef5EF',
          '100000': undefined
        },
        tokenAddress: '0x75B0622Cec14130172EaE9Cf166B92E5C112FaFF',
        decimals: 6
      },
      cusdc: {
        mixerAddress: {
          '5000': '0xc0648F28ABA385c8a1421Bbf1B59e3c474F89cB0',
          '50000': '0x0C53853379c6b1A7B74E0A324AcbDD5Eabd4981D',
          '500000': '0xf84016A0E03917cBe700D318EB1b7a53e6e3dEe1',
          '5000000': undefined
        },
        tokenAddress: '0xcfC9bB230F00bFFDB560fCe2428b4E05F3442E35',
        decimals: 8
      },
      eth: {
        mixerAddress: {
          '0.1': '0x8b3f5393bA08c24cc7ff5A66a832562aAB7bC95f',
          '1': '0xD6a6AC46d02253c938B96D12BE439F570227aE8E',
          '10': '0xe1BE96331391E519471100c3c1528B66B8F4e5a7',
          '100': '0xd037E0Ac98Dab2fCb7E296c69C6e52767Ae5414D'
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