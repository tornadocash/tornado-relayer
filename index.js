const { numberToHex, toWei, toHex, toBN, toChecksumAddress } = require('web3-utils')
const { netId, rpcUrl, privateKey, mixers, defaultGasPrice } = require('./config')
const { fetchGasPrice, isValidProof, isValidArgs, fetchDAIprice, isKnownContract } = require('./utils')
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

const web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 })
const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
web3.eth.accounts.wallet.add('0x' + privateKey)
web3.eth.defaultAccount = account.address

const mixerABI = require('./abis/mixerABI.json') 
const gasPrices = { fast: defaultGasPrice }
const ethPriceInDai = toWei('200')

app.get('/', function (req, res) {
  // just for testing purposes
  res.send('This is <a href=https://tornado.cash>tornado.cash</a> Relayer service. Check the /status for settings')
})

app.get('/status', function (req, res) {
  res.json({ relayerAddress: web3.eth.defaultAccount, mixers, gasPrices, netId, ethPriceInDai })
})

app.post('/relay', async (req, resp) => {
  const { proof, args, contract } = req.body
  let { valid , reason } = isValidProof(proof)
  if (!valid) {
    console.log('Proof is invalid:', reason)
    return resp.status(400).json({ error: 'Proof format is invalid' })
  }

  ({ valid , reason } = isValidArgs(args))
  if (!valid) {
    console.log('Args are invalid:', reason)
    return resp.status(400).json({ error: 'Withdraw arguments are invalid' })
  }

  let currency
  ( { valid, currency } = isKnownContract(contract))
  if (!valid) {
    console.log('Contract does not exist:', contract)
    return resp.status(400).json({ error: 'This relayer does not support the token' })
  }

  const [ root, nullifierHash, recipient, relayer, fee, refund ] = [
    args[0],
    args[1],
    toChecksumAddress(args[2]),
    toChecksumAddress(args[3]),
    toBN(args[4]),
    toBN(args[5])
  ]

  if (relayer !== web3.eth.defaultAccount) {
    console.log('This proof is for different relayer:', relayer)
    return resp.status(400).json({ error: 'Relayer address is invalid' })
  }

  const expense = toBN(toWei(gasPrices.fast.toString(), 'gwei')).mul(toBN('1000000'))
  let desiredFee
  switch (currency) {
    case 'eth': {
      if (!refund.isZero()) {
        return resp.status(400).json({ error: 'Cannot send refund for eth currency.' })
      }
      desiredFee = expense
      break
    }
    case 'dai': {
      desiredFee = expense.add(refund).mul(toBN(ethPriceInDai)).div(toBN(10 ** 18))
      break
    }
  }

  if (fee.lt(desiredFee)) {
    console.log('Fee is too low')
    return resp.status(400).json({ error: 'Fee is too low. Try to resend.' })
  }

  try {
    const mixer = new web3.eth.Contract(mixerABI, req.body.contract)
    const isSpent = await mixer.methods.isSpent(nullifierHash).call()
    if (isSpent) {
      return resp.status(400).json({ error: 'The note has been spent.' })
    }
    const isKnownRoot = await mixer.methods.isKnownRoot(root).call()
    if (!isKnownRoot) {
      return resp.status(400).json({ error: 'The merkle root is too old or invalid.' })
    }
    const withdrawArgs = [
      proof,
      root,
      nullifierHash,
      recipient,
      relayer,
      fee.toString(),
      refund.toString()
    ]
    const gas = await mixer.methods.withdraw(...withdrawArgs).estimateGas({ 
      from: web3.eth.defaultAccount,
      value: refund 
    })
    const result = mixer.methods.withdraw(...withdrawArgs).send({
      from: web3.eth.defaultAccount,
      value: refund,
      gas: numberToHex(gas + 50000),
      gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
      // TODO: nonce
    })
    result.once('transactionHash', function(txHash){
      resp.json({ txHash })
      console.log(`A new successfuly sent tx ${txHash} for the ${recipient}`)
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

console.log('Relayer started')
console.log(`relayerAddress: ${web3.eth.defaultAccount}`)
console.log(`mixers: ${JSON.stringify(mixers)}`)
console.log(`gasPrices: ${JSON.stringify(gasPrices)}`)
console.log(`netId: ${netId}`)
console.log(`ethPriceInDai: ${ethPriceInDai}`)