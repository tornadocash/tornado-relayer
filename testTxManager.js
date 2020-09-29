const { toHex, toWei } = require('web3-utils')
const TxManager = require('./src/TxManager')
const { rpcUrl, privateKey } = require('./config')

const TxM = new TxManager({
  privateKey,
  rpcUrl,
  config: {
    CONFIRMATIONS: 2,
    GAS_BUMP_INTERVAL: 1000 * 15,
  },
})

const tx = {
  from: '0x03Ebd0748Aa4D1457cF479cce56309641e0a98F5',
  value: 0,
  // gasPrice: toHex(toWei('0.1', 'gwei')),
  to: '0x03Ebd0748Aa4D1457cF479cce56309641e0a98F5',
}

async function main() {
  const receipt = await TxM.submit(tx)
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

  // const hash = await when(TxM.submit(tx), 'transactionHash')
  // console.log('hash', hash)
}

main()
