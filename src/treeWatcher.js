const MerkleTree = require('fixed-merkle-tree')
const { redisUrl, wsRpcUrl, minerMerkleTreeHeight, torn } = require('./config')
const { poseidonHash2 } = require('./utils')
const { toBN } = require('web3-utils')
const Redis = require('ioredis')
const redis = new Redis(redisUrl)
const ENSResolver = require('./resolver')
const resolver = new ENSResolver()
const Web3 = require('web3')
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(wsRpcUrl, {
    clientConfig: {
      maxReceivedFrameSize: 100000000,
      maxReceivedMessageSize: 100000000,
    },
  }),
)
const MinerABI = require('../abis/mining.abi.json')
let contract

// eslint-disable-next-line no-unused-vars
let tree, eventSubscription, blockSubscription

// todo handle the situation when we have two rewards in one block
async function fetchEvents(from = 0, to = 'latest') {
  try {
    const events = await contract.getPastEvents('NewAccount', {
      fromBlock: from,
      toBlock: to,
    })
    return events
      .sort((a, b) => a.returnValues.index - b.returnValues.index)
      .map(e => toBN(e.returnValues.commitment))
  } catch (e) {
    console.error('error fetching events', e)
  }
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
    const block = await web3.eth.getBlockNumber()
    const events = await fetchEvents(0, block)
    tree = new MerkleTree(minerMerkleTreeHeight, events, { hashFunction: poseidonHash2 })
    await updateRedis()
    console.log(`Rebuilt tree with ${events.length} elements, root: ${tree.root()}`)
    eventSubscription = contract.events.NewAccount({ fromBlock: block + 1 }, processNewEvent)
    blockSubscription = web3.eth.subscribe('newBlockHeaders', processNewBlock)
  } catch (e) {
    console.error('error on init treeWatcher', e.message)
  }
}

init()

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection', error)
  process.exit(1)
})
