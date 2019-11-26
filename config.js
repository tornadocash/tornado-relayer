require('dotenv').config()

module.exports = {
  netId: Number(process.env.NET_ID) || 42,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixers: [ { 
    address: process.env.ETH_MIXER_ADDRESS,
    currency: 'eth',
    amount: '0.1'
  }, 
  { 
    address: process.env.DAI_MIXER_ADDRESS,
    currency: 'dai',
    amount: '100'
  } ],
  defaultGasPrice: 2,
  gasOracleUrls: ['https://www.etherchain.org/api/gasPriceOracle', 'https://gasprice.poa.network/'],
  port: process.env.APP_PORT,
  //dai
  tokens: ['0x6b175474e89094c44da98b954eedeac495271d0f'],
  relayerServiceFee: process.env.RELAYER_FEE
}