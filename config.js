require('dotenv').config()

module.exports = {
  netId: process.env.NET_ID || 42,
  rpcUrl: process.env.RPC_URL || 'https://kovan.infura.io/v3/a3f4d001c1fc4a359ea70dd27fd9cb51',
  privateKey: process.env.PRIVATE_KEY,
  mixerAddress: process.env.MIXER_ADDRESS || '0x30AF2e92263C5387A8A689322BbfE60b6B0855C4',
  defaultGasPrice: process.env.DEFAULT_GAS_PRICE || 1,
  gasOracleUrls: process.env.GAS_ORACLE_URLS ? process.env.GAS_ORACLE_URLS.split(' ') : ['https://www.etherchain.org/api/gasPriceOracle', 'https://gasprice.poa.network/']
}