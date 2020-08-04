const Web3 = require('web3')
const { rpcUrl, privateKey } = require('../config')

function setup() {
  try {
    const web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
    web3.eth.accounts.wallet.add('0x' + privateKey)
    web3.eth.defaultAccount = account.address
    return web3
  } catch (e) {
    console.error('web3 failed')
  }
}
const web3 = setup()
module.exports = web3
