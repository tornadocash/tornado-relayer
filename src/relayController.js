const { numberToHex, toWei, toHex, toBN, toChecksumAddress } = require('web3-utils')
const mixerABI = require('../abis/mixerABI.json') 
const { 
  isValidProof, isValidArgs, isKnownContract, isEnoughFee
} = require('./utils')

const { web3, fetcher } = require('./instances')

async function relay (req, resp) {
  const { proof, args, contract } = req.body
  const gasPrices = fetcher.gasPrices
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

  let currency, amount
  ( { valid, currency, amount } = isKnownContract(contract))
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
  console.log('fee, refund', fee.toString(), refund.toString())
  if (currency === 'eth' && !refund.isZero()) {
    return resp.status(400).json({ error: 'Cannot send refund for eth currency.' })
  }

  if (relayer !== web3.eth.defaultAccount) {
    console.log('This proof is for different relayer:', relayer)
    return resp.status(400).json({ error: 'Relayer address is invalid' })
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
    let gas = await mixer.methods.withdraw(...withdrawArgs).estimateGas({ 
      from: web3.eth.defaultAccount,
      value: refund 
    })

    gas += 50000
    const ethPrices = fetcher.ethPrices
    const { isEnough, reason } = isEnoughFee({ gas, gasPrices, currency, amount, refund, ethPrices, fee })
    if (!isEnough) {
      console.log(`Wrong fee: ${reason}`)
      return resp.status(400).json({ error: reason })
    }

    const result = mixer.methods.withdraw(...withdrawArgs).send({
      from: web3.eth.defaultAccount,
      value: refund,
      gas: numberToHex(gas),
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
    console.error(e.message, 'estimate gas failed')
    return resp.status(400).json({ error: 'Proof is malformed or spent.' })
  }
}

module.exports = relay