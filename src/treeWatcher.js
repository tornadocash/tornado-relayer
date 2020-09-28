const MerkleTree = require('fixed-merkle-tree')
const { redisUrl, rpcUrl, minerMerkleTreeHeight, minerAddress } = require('../config')
const { poseidonHash2 } = require('./utils')
const { toBN } = require('web3-utils')
const Redis = require('ioredis')
const redis = new Redis(redisUrl)
const Web3 = require('web3')
const web3 = new Web3(rpcUrl)
const contract = new web3.eth.Contract(require('../abis/mining.abi.json'), minerAddress)

let tree, eventSubscription, blockSubscription

async function fetchEvents(from = 0, to = 'latest') {
  const events = await contract.getPastEvents('NewAccount', {
    fromBlock: from,
    toBlock: to,
  })
  return events
    .sort((a, b) => a.returnValues.index - b.returnValues.index)
    .map((e) => toBN(e.returnValues.commitment))
}

async function processNewEvent(err, event) {
  if (err) {
    throw new Error(`Event handler error: ${err}`)
    // console.error(err)
    // return
  }

  console.log('New account event', event.returnValues)
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
    await rebuild()
  }
}

async function processNewBlock(err) {
  if (err) {
    throw new Error(`Event handler error: ${err}`)
    // console.error(err)
    // return
  }
  await updateRedis()
}

async function updateRedis() {
  const rootOnContract = await contract.methods.getLastAccountRoot().call()
  if (!tree.root().eq(toBN(rootOnContract))) {
    console.log(`Invalid tree root: ${tree.root()} != ${toBN(rootOnContract)}, rebuilding tree`)
    await rebuild()
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

async function rebuild() {
  await eventSubscription.unsubscribe()
  await blockSubscription.unsubscribe()
  setTimeout(init, 3000)
}

async function init() {
  console.log('Initializing')
  const block = await web3.eth.getBlockNumber()
  const events = await fetchEvents(0, block)
  tree = new MerkleTree(minerMerkleTreeHeight, events, { hashFunction: poseidonHash2 })
  console.log(`Rebuilt tree with ${events.length} elements, root: ${tree.root()}`)
  eventSubscription = contract.events.NewAccount({ fromBlock: block + 1 }, processNewEvent)
  blockSubscription = web3.eth.subscribe('newBlockHeaders', processNewBlock)
  await updateRedis()
}

init()

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection', error)
  process.exit(1)
})
