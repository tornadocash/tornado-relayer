const { toHex, toWei } = require('web3-utils')
const TxManager = require('./src/TxManager')
const { rpcUrl, privateKey } = require('./config')
const logHandles = require('why-is-node-running')

const manager = new TxManager({
  privateKey,
  rpcUrl,
  config: {
    CONFIRMATIONS: 1,
    GAS_BUMP_INTERVAL: 1000 * 15,
  },
})

const tx1 = {
  value: 1,
  gasPrice: toHex(toWei('1', 'gwei')),
  to: '0xA43Ce8Cc89Eff3AA5593c742fC56A30Ef2427CB0',
}

const tx2 = {
  value: 2,
  // gasPrice: toHex(toWei('1', 'gwei')),
  to: '0x0039F22efB07A647557C7C5d17854CFD6D489eF3',
}

async function main() {
  const tx = manager.createTx(tx1)

  setTimeout(() => tx.cancel(), 1000)
  // setTimeout(() => tx.replace(tx2), 1000)

  const receipt = await tx.send()
    .on('transactionHash', (hash) => {
      console.log('hash', hash)
    })
    .on('mined', (receipt) => {
      console.log('Mined in block', receipt.blockNumber)
    })
    .on('confirmations', (confirmations) => {
      console.log('confirmations', confirmations)
    })

  console.log('receipt', receipt)
  // setTimeout(logHandles, 100)
}

main()
