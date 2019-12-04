const Fetcher = require('./Fetcher')
const web3 = require('./setupWeb3')
const fetcher = new Fetcher(web3)

module.exports = {
  fetcher,
  web3
}