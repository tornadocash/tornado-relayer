const jobType = Object.freeze({
  TORNADO_WITHDRAW: 'TORNADO_WITHDRAW',
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
}

module.exports = {
  jobType,
  status,
  networkConfig,
}
