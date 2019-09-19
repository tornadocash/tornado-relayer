require('dotenv').config()

module.exports = {
  netId: process.env.NET_ID || 42,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixers: [ { 
    address: process.env.ETH_MIXER_ADDRESS,
    currency: 'eth' 
  }, 
  { 
    address: process.env.DAI_MIXER_ADDRESS,
    currency: 'dai' 
  } ],
  defaultGasPrice: 2,
  gasOracleUrls: ['https://www.etherchain.org/api/gasPriceOracle', 'https://gasprice.poa.network/'],
  ethdaiAddress: '0x7Ef645705cb7D401C5CD91a395cfcc3Db3C93689'
}