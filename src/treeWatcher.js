const MerkleTree = require('fixed-merkle-tree')
const { minerMerkleTreeHeight, torn, netId } = require('./config')
const { poseidonHash2, toBN, logRelayerError } = require('./utils')
const resolver = require('./modules/resolver')
const web3 = require('./modules/web3')('ws')
const MinerABI = require('../abis/mining.abi.json')
const { redis } = require('./modules/redis')
let contract

// eslint-disable-next-line no-unused-vars
let tree, eventSubscription, blockSubscription

async function fetchEvents(fromBlock, toBlock) {
  if (fromBlock <= toBlock) {
    try {
      return await contract.getPastEvents('NewAccount', {
        fromBlock,
        toBlock,
      })
    } catch (error) {
      const midBlock = (fromBlock + toBlock) >> 1

      if (midBlock - fromBlock < 2) {
        throw new Error(`error fetching events: ${error.message}`)
      }

      const arr1 = await fetchEvents(fromBlock, midBlock)
      const arr2 = await fetchEvents(midBlock + 1, toBlock)
      return [...arr1, ...arr2]
    }
  }
  return []
}

async function processNewEvent(err, event) {
  if (err) {
    throw new Error(`Event handler error: ${err}`)
    // console.error(err)
    // return
  }

  console.log(
    `New account event
    Index: ${event.returnValues.index}
    Commitment: ${event.returnValues.commitment}
    Nullifier: ${event.returnValues.nullifier}
    EncAcc: ${event.returnValues.encryptedAccount}`,
  )
  const { commitment, index } = event.returnValues
  if (tree.elements().length === Number(index)) {
    tree.insert(toBN(commitment))
    await updateRedis()
  } else if (tree.elements().length === Number(index) + 1) {
    console.log('Replacing element', index)
    tree.update(index, toBN(commitment))
    await updateRedis()
  } else {
    console.log(`Invalid element index ${index}, rebuilding tree`)
    rebuild()
  }
}

async function processNewBlock(err) {
  if (err) {
    throw new Error(`Event handler error: ${err}`)
    // console.error(err)
    // return
  }
  // what if updateRedis takes more than 15 sec?
  await updateRedis()
}

async function updateRedis() {
  const rootOnContract = await contract.methods.getLastAccountRoot().call()
  if (!tree.root().eq(toBN(rootOnContract))) {
    console.log(`Invalid tree root: ${tree.root()} != ${toBN(rootOnContract)}, rebuilding tree`)
    rebuild()
    return
  }
  const rootInRedis = await redis.get('tree:root')
  if (!rootInRedis || !tree.root().eq(toBN(rootInRedis))) {
    const serializedTree = JSON.stringify(tree.serialize())
    await redis.set('tree:elements', serializedTree)
    await redis.set('tree:root', tree.root().toString())
    await redis.publish('treeUpdate', tree.root().toString())
    console.log('Updated tree in redis, new root:', tree.root().toString())
  } else {
    console.log('Tree in redis is up to date, skipping update')
  }
}

function rebuild() {
  process.exit(1)
  // await eventSubscription.unsubscribe()
  // await blockSubscription.unsubscribe()
  // setTimeout(init, 3000)
}

async function init() {
  try {
    console.log('Initializing')
    const miner = await resolver.resolve(torn.miningV2.address)
    contract = new web3.eth.Contract(MinerABI, miner)

    const cachedEvents = require(`../cache/accounts_farmer_${netId}.json`)
    const cachedCommitments = cachedEvents.map(e => toBN(e.commitment))

    const toBlock = await web3.eth.getBlockNumber()
    const [{ blockNumber: fromBlock }] = cachedEvents.slice(-1)

    const newEvents = await fetchEvents(fromBlock + 1, toBlock)
    const newCommitments = newEvents
      .sort((a, b) => a.returnValues.index - b.returnValues.index)
      .map(e => toBN(e.returnValues.commitment))
      .filter((item, index, arr) => !index || item !== arr[index - 1])

    const commitments = cachedCommitments.concat(newCommitments)

    tree = new MerkleTree(minerMerkleTreeHeight, commitments, { hashFunction: poseidonHash2 })
    await updateRedis()
    console.log(`Rebuilt tree with ${commitments.length} elements, root: ${tree.root()}`)

    eventSubscription = contract.events.NewAccount({ fromBlock: toBlock + 1 }, processNewEvent)
    blockSubscription = web3.eth.subscribe('newBlockHeaders', processNewBlock)
  } catch (e) {
    await logRelayerError(redis, e)
    console.error('error on init treeWatcher', e.message)
  }
}

init()

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection', error)
  process.exit(1)
})
