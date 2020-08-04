const Queue = require('bull')
const { numberToHex, toWei, toHex, toBN, toChecksumAddress } = require('web3-utils')
const mixerABI = require('../abis/mixerABI.json')
const { isValidProof, isValidArgs, isKnownContract, isEnoughFee } = require('./utils')
const config = require('../config')
const { redisClient, redisOpts } = require('./redis')

const { web3, fetcher, sender, gasPriceOracle } = require('./instances')
const withdrawQueue = new Queue('withdraw', redisOpts)

const reponseCbs = {}
let respLambda = (job, { msg, status }) => {
  const resp = reponseCbs[job.id]
  resp.status(status).json(msg)
  delete reponseCbs[job.id]
}
withdrawQueue.on('completed', respLambda)

async function relayController(req, resp) {
  let requestJob

  const { proof, args, contract } = req.body
  let { valid, reason } = isValidProof(proof)
  if (!valid) {
    console.log('Proof is invalid:', reason)
    return resp.status(400).json({ error: 'Proof format is invalid' })
  }

  // eslint-disable-next-line no-extra-semi
  ;({ valid, reason } = isValidArgs(args))
  if (!valid) {
    console.log('Args are invalid:', reason)
    return resp.status(400).json({ error: 'Withdraw arguments are invalid' })
  }

  let currency, amount
  ;({ valid, currency, amount } = isKnownContract(contract))
  if (!valid) {
    console.log('Contract does not exist:', contract)
    return resp.status(400).json({ error: 'This relayer does not support the token' })
  }

  const [root, nullifierHash, recipient, relayer, fee, refund] = [
    args[0],
    args[1],
    toChecksumAddress(args[2]),
    toChecksumAddress(args[3]),
    toBN(args[4]),
    toBN(args[5])
  ]
  console.log('fee, refund', fee.toString(), refund.toString(), recipient)
  if (currency === 'eth' && !refund.isZero()) {
    return resp.status(400).json({ error: 'Cannot send refund for eth currency.' })
  }

  if (relayer !== web3.eth.defaultAccount) {
    console.log('This proof is for different relayer:', relayer)
    return resp.status(400).json({ error: 'Relayer address is invalid' })
  }

  requestJob = await withdrawQueue.add(
    {
      contract,
      nullifierHash,
      root,
      proof,
      args,
      currency,
      amount,
      fee: fee.toString(),
      refund: refund.toString()
    },
    { removeOnComplete: true }
  )
  reponseCbs[requestJob.id] = resp
}

withdrawQueue.process(async function (job, done) {
  console.log(Date.now(), ' withdraw started', job.id)
  const gasPrices = await gasPriceOracle.gasPrices()
  const { contract, nullifierHash, root, proof, args, refund, currency, amount, fee } = job.data
  console.log(JSON.stringify(job.data))
  // job.data contains the custom data passed when the job was created
  // job.id contains id of this job.
  try {
    const mixer = new web3.eth.Contract(mixerABI, contract)
    const isSpent = await mixer.methods.isSpent(nullifierHash).call()
    if (isSpent) {
      done(null, {
        status: 400,
        msg: {
          error: 'The note has been spent.'
        }
      })
      return
    }
    const isKnownRoot = await mixer.methods.isKnownRoot(root).call()
    if (!isKnownRoot) {
      done(null, {
        status: 400,
        msg: {
          error: 'The merkle root is too old or invalid.'
        }
      })
      return
    }

    let gas = await mixer.methods.withdraw(proof, ...args).estimateGas({
      from: web3.eth.defaultAccount,
      value: refund
    })

    gas += 50000
    const ethPrices = fetcher.ethPrices
    const { isEnough, reason } = isEnoughFee({
      gas,
      gasPrices,
      currency,
      amount,
      refund: toBN(refund),
      ethPrices,
      fee: toBN(fee)
    })
    if (!isEnough) {
      console.log(`Wrong fee: ${reason}`)
      done(null, {
        status: 400,
        msg: { error: reason }
      })
      return
    }

    const data = mixer.methods.withdraw(proof, ...args).encodeABI()
    let nonce = Number(await redisClient.get('nonce'))
    console.log('nonce', nonce)
    const tx = {
      from: web3.eth.defaultAccount,
      value: numberToHex(refund),
      gas: numberToHex(gas),
      gasPrice: toHex(toWei(gasPrices.fast.toString(), 'gwei')),
      // you can use this gasPrice to test watcher
      // gasPrice: numberToHex(100000000),
      to: mixer._address,
      netId: config.netId,
      data,
      nonce
    }
    tx.date = Date.now()
    await redisClient.set('tx:' + nonce, JSON.stringify(tx))
    nonce += 1
    await redisClient.set('nonce', nonce)
    sender.sendTx(tx, done)
  } catch (e) {
    console.error(e, 'estimate gas failed')
    done(null, {
      status: 400,
      msg: { error: 'Internal Relayer Error. Please use a different relayer service' }
    })
  }
})

module.exports = relayController
