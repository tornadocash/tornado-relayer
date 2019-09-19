const { numberToHex, toWei, toHex, toBN } = require('web3-utils')
const Web3 = require('web3')
const express = require('express')

const app = express()
app.use(express.json())

app.use((err, req, res, next) => {
  if (err) {
    console.log('Invalid Request data')
    res.send('Invalid Request data')
  } else {
    next()
  }
})

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const { netId, rpcUrl, privateKey, mixers, defaultGasPrice } = require('./config')
const { fetchGasPrice, isValidProof, fetchDAIprice, isKnownContract } = require('./utils')

const web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
web3.eth.accounts.wallet.add('0x' + privateKey)
web3.eth.defaultAccount = account.address

const mixerABI = require('./abis/mixerABI.json') 
const gasPrices = { fast: defaultGasPrice }
const ethPriceInDai = toWei('200')

app.get('/', function (req, res) {
  // just for testing purposes
  res.send(`Tornado mixer relayer. Gas Price is ${JSON.stringify(gasPrices)}. Mixer addresses are ${mixers}`)
})

app.post('/relay', async (req, resp) => {
  let { valid , reason } = isValidProof(req.body.proof)
  if (!valid) {
    console.log('Proof is invalid:', reason)
    return resp.status(400).json({ error: 'Proof is invalid' })
  }
  let currency
  ( { valid, currency } = isKnownContract(req.body.contract))

  let { pi_a, pi_b, pi_c, publicSignals } = req.body.proof

  const fee = toBN(publicSignals[3])
  const expense = toBN(toWei(gasPrices.fast.toString(), 'gwei')).mul(toBN('1000000'))
  let desiredFee
  switch (currency) {
    case 'eth': {
      desiredFee = expense
      break
    }
    case 'dai': {
      desiredFee = expense.mul(toBN(ethPriceInDai)).div(toBN(10 ** 18))
      break
    }
  }

  if (fee.lt(desiredFee)) {
    console.log('Fee is too low')
    return resp.status(400).json({ error: 'Fee is too low. Try to resend.' })
  }

  try {
    const mixer = new web3.eth.Contract(mixerABI, req.body.contract)
    const nullifier = publicSignals[1]
    const isSpent = await mixer.methods.isSpent(nullifier).call()
    if (isSpent) {
      return resp.status(400).json({ error: 'The note has been spent.' })
    }
    const root = publicSignals[0]
    const isKnownRoot = await mixer.methods.isKnownRoot(root).call()
    if (!isKnownRoot) {
      return resp.status(400).json({ error: 'The merkle root is too old or invalid.' })
    }
    const gas = await mixer.methods.withdraw(pi_a, pi_b, pi_c, publicSignals).estimateGas()
    const result = mixer.methods.withdraw(pi_a, pi_b, pi_c, publicSignals).send({
      gas: numberToHex(gas + 50000),
      gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
      // TODO: nonce
    })
    result.once('transactionHash', function(hash){
      resp.json({ txHash: hash })
    }).on('error', function(e){
      console.log(e)
      return resp.status(400).json({ error: 'Proof is malformed.' })
    })
  } catch (e) {
    console.log(e)
    return resp.status(400).json({ error: 'Proof is malformed or spent.' })
  }
})

app.listen(8000)

if (Number(netId) === 1) {
  fetchGasPrice({ gasPrices })
  fetchDAIprice({ ethPriceInDai, web3 })
  console.log('Gas price oracle started.')
}
