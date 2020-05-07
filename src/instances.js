const Fetcher = require('./Fetcher')
const Sender = require('./Sender')
const web3 = require('./setupWeb3')
const fetcher = new Fetcher(web3)
const sender = new Sender(1, web3)

module.exports = {
  fetcher,
  web3,
  sender
}