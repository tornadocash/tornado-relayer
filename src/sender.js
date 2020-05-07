const { redisClient } = require('./redis')
const config = require('../config')

class Sender {
  constructor(minedNonce, web3) {
    this.minedNonce = Number(minedNonce)
    this.web3 = web3
  }

  async main() {
    const lastNonce = await redisClient.get('nonce')
    for(let nonce = this.minedNonce; nonce < lastNonce + 1; nonce++) {
      let tx = await redisClient.get('tx' + nonce)
      tx = JSON.parse(tx)
      const isMined = await this.checkTx(tx)

    }
  }

  async checkTx(tx) {
    const networkNonce = await this.web3.eth.getTransactionCount(this.web3.eth.defaultAccount)
    if ()
  }

  async sendTx(tx, retryAttempt = 1) {
    let signedTx = await this.web3.eth.accounts.signTransaction(tx, config.privateKey)
    let result = this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    let txHash
    result.once('transactionHash', function(_txHash){
        console.log(`A new successfully sent tx ${_txHash}`)
        txHash = _txHash
    }).on('error', async function(e){
      console.log('error', e.message)
      if(e.message === 'Returned error: Transaction gas price supplied is too low. There is another transaction with same nonce in the queue. Try increasing the gas price or incrementing the nonce.' 
      || e.message === 'Returned error: Transaction nonce is too low. Try incrementing the nonce.'
      || e.message === 'Returned error: nonce too low'
      || e.message === 'Returned error: replacement transaction underpriced') {
        console.log('nonce too low, retrying')
        if(retryAttempt <= 10) {
          retryAttempt++
          const newNonce = tx.nonce + 1
          tx.nonce = newNonce
          await redisClient.set('nonce', newNonce)
          txHash = this.sendTx(tx, retryAttempt)
          return
        }
      }
      throw new Error(e.message)
    })
    return txHash
  }
}

module.exports = Sender