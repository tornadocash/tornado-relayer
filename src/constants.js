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
          0.1: '0x0Ce22770451A8acAD1220D9d1678656b4fAe4a1d',
        },
        symbol: 'BNB',
        decimals: 18,
      },
    },
    proxyLight: '0x5D595DB16eb6d074E0e7E7f0bE37E7e75f23BEc7',
  },
}

module.exports = {
  jobType,
  status,
  networkConfig,
}
