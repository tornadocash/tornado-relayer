const fs = require('fs')
const { Controller } = require('tornado-cash-anonymity-mining')
const { web3 } = require('./instances')
const { farmingAddress, farmingMerkleTreeHeight } = require('../config')

const contract = web3.eth.contract(require('../abis/mining.abi.json'), farmingAddress)
const provingKeys = {
  treeUpdateCircuit: require('.../keys/TreeUpdate.json'),
  treeUpdateProvingKey: fs.readFileSync('../keys/TreeUpdate_proving_key.bin').buffer,
}
const controller = new Controller({
  contract,
  provingKeys,
  merkleTreeHeight: farmingMerkleTreeHeight,
})


// await controller.init()
// await controller.treeUpdate(commitment)
