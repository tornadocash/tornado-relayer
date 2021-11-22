const jobType = Object.freeze({
  TORNADO_WITHDRAW: 'TORNADO_WITHDRAW',
  ARB_TORNADO_WITHDRAW: 'ARB_TORNADO_WITHDRAW',
})

const status = Object.freeze({
  QUEUED: 'QUEUED',
  ACCEPTED: 'ACCEPTED',
  SENT: 'SENT',
  MINED: 'MINED',
  RESUBMITTED: 'RESUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
})

const networkConfig = {
  netId56: {
    gasPrices: {
      instant: 5,
      fast: 5,
      standard: 5,
      low: 5,
    },
    nativeCurrency: 'bnb',
    instances: {
      bnb: {
        instanceAddress: {
          0.1: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F',
          1: '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
          10: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          100: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
        },
        symbol: 'BNB',
        decimals: 18,
      },
    },
    proxyLight: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
  },
  netId100: {
    gasPrices: {
      instant: 6,
      fast: 5,
      standard: 4,
      low: 1,
    },
    nativeCurrency: 'xdai',
    instances: {
      xdai: {
        instanceAddress: {
          100: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          1000: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178',
          10000: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040',
          100000: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998',
        },
        symbol: 'xDAI',
        decimals: 18,
      },
    },
    proxyLight: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
  },
  netId137: {
    gasPrices: {
      instant: 100,
      fast: 75,
      standard: 50,
      low: 30,
    },
    nativeCurrency: 'matic',
    instances: {
      matic: {
        instanceAddress: {
          100: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          1000: '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178',
          10000: '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040',
          100000: '0xa5C2254e4253490C54cef0a4347fddb8f75A4998',
        },
        symbol: 'MATIC',
        decimals: 18,
      },
    },
    proxyLight: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
  },
  netId42161: {
    gasPrices: {
      instant: 4,
      fast: 3,
      standard: 2.52,
      low: 2.29,
    },
    nativeCurrency: 'eth',
    instances: {
      eth: {
        instanceAddress: {
          0.1: '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F',
          1: '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
          10: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          100: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
        },
        symbol: 'ETH',
        decimals: 18,
      },
    },
    proxyLight: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
  },
  netId43114: {
    gasPrices: {
      instant: 225,
      fast: 35,
      standard: 25,
      low: 25,
    },
    nativeCurrency: 'avax',
    instances: {
      avax: {
        instanceAddress: {
          10: '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          100: '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          500: '0xaf8d1839c3c67cf571aa74B5c12398d4901147B3',
        },
        symbol: 'AVAX',
        decimals: 18,
      },
    },
    proxyLight: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
  },
}

module.exports = {
  jobType,
  status,
  networkConfig,
}
