require('dotenv').config()

module.exports = {
  netId: process.env.NET_ID || 42,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixerAddress: process.env.MIXER_ADDRESS,
  defaultGasPrice: 2,
  gasOracleUrls: ['https://ethgasstation.info/json/ethgasAPI.json', 'https://gasprice.poa.network/']
}