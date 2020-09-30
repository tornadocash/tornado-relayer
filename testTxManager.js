const { toHex, toWei } = require('web3-utils')
const TxManager = require('./src/TxManager')
const { rpcUrl, privateKey } = require('./config')

const TxM = new TxManager({
  privateKey,
  rpcUrl,
  config: {
    CONFIRMATIONS: 1,
    GAS_BUMP_INTERVAL: 1000 * 15,
  },
})

const tx = {
  value: 0,
  gasPrice: toHex(toWei('0.1', 'gwei')),
  to: '0xA43Ce8Cc89Eff3AA5593c742fC56A30Ef2427CB0',
}

const tx2 = {
  value: 1,
  // gasPrice: toHex(toWei('0.1', 'gwei')),
  to: '0x0039F22efB07A647557C7C5d17854CFD6D489eF3',
}

async function main() {
  const Tx = await TxM.createTx(tx)

  const receipt1 = await Tx.send()
    .on('transactionHash', (hash) => {
      console.log('hash', hash)
    })
    .on('mined', (receipt) => {
      console.log('Mined in block', receipt.blockNumber)
    })
    .on('confirmations', (confirmations) => {
      console.log('confirmations', confirmations)
    })

  // setTimeout(async () => await Tx.cancel(), 800)

  // const receipt2 = await Tx.replace(tx2)
  //   .on('transactionHash', (hash) => {
  //     console.log('hash', hash)
  //   })
  //   .on('mined', (receipt) => {
  //     console.log('Mined in block', receipt.blockNumber)
  //   })
  //   .on('confirmations', (confirmations) => {
  //     console.log('confirmations', confirmations)
  //   })

  // console.log('receipt2', receipt2)
  console.log('receipt1', await receipt1)
}

main()
