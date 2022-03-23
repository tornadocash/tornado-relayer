const Web3 = require('web3')
const { oracleRpcUrl, httpRpcUrl, wsRpcUrl } = require('../config')
const getWeb3 = (type = 'http') => {
  let url
  switch (type) {
    case 'oracle':
      url = oracleRpcUrl
      break
    case 'ws':
      url = wsRpcUrl
      return new Web3(
        new Web3.providers.WebsocketProvider(wsRpcUrl, {
          clientConfig: {
            maxReceivedFrameSize: 100000000,
            maxReceivedMessageSize: 100000000,
          },
        }),
      )
    case 'http':
    default:
      url = httpRpcUrl
      break
  }
  return new Web3(
    new Web3.providers.HttpProvider(url, {
      timeout: 200000, // ms
    }),
  )
}
module.exports = getWeb3
