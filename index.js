const { fetchGasPrice, isValidProof } = require('./utils')
const { numberToHex, toWei, toHex } = require('web3-utils')

const express = require('express')
const app = express()
app.use(express.json())

const { netId, rpcUrl, privateKey, mixerAddress, defaultGasPrice } = require('./env.json')

const Web3 = require('web3')
const web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
web3.eth.accounts.wallet.add('0x' + privateKey)
web3.eth.defaultAccount = account.address

const mixerABI = require('./mixerABI.json')
const mixer = new web3.eth.Contract(mixerABI, mixerAddress)
const gasPrices = { fast: defaultGasPrice }

app.get('/', function (req, res) {
  // just for testing purposes
  res.send(`Tornado mixer relayer. Gas Price is ${JSON.stringify(gasPrices)}`)
})

app.post('/relay', async (req, resp) => {
  const { valid , reason } = isValidProof(req.body)
  if (!valid) {
    console.log('Proof is invalid:', reason)
    return resp.status(400).send('Proof is invalid')
  }

  let { pi_a, pi_b, pi_c, publicSignals } = req.body

  // TODO
  // if (bigInt(proof.publicSignals[3]) < getMinimumFee()) {
  //   resp.status(403).send('Fee is too low')
  // }

  try {
    const nullifier = publicSignals[1]
    const isSpent = await mixer.methods.isSpent(nullifier).call()
    if (isSpent) {
      throw new Error('The note has been spent')
    }
    const root = publicSignals[0]
    const isKnownRoot = await mixer.methods.isKnownRoot(root).call()
    if (!isKnownRoot) {
      throw new Error('The merkle root is too old or invalid')
    }
    const gas = await mixer.methods.withdraw(pi_a, pi_b, pi_c, publicSignals).estimateGas()
    const result = mixer.methods.withdraw(pi_a, pi_b, pi_c, publicSignals).send({
      gas: numberToHex(gas + 50000),
      gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
      // TODO: nonce
    })
    result.once('transactionHash', function(hash){
      resp.send({ transaction: hash })
    }).on('error', function(e){
      console.log(e)
      resp.status(400).send('Proof is malformed')
    })
  } catch (e) {
    console.log(e)
    resp.status(400).send('Proof is malformed or spent')
  }
})

app.listen(8000)

if (netId === 1) {
  fetchGasPrice({ gasPrices })
  console.log('Gas price oracle started.')
}
