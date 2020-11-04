const { httpRpcUrl, aggregatorAddress } = require('./config')
const Web3 = require('web3')
const web3 = new Web3(httpRpcUrl)
const aggregator = new web3.eth.Contract(require('../abis/Aggregator.abi.json'), aggregatorAddress)
const ens = require('eth-ens-namehash')

class ENSResolver {
  constructor() {
    this.addresses = {}
  }

  async resolve(domains) {
    if (!Array.isArray(domains)) {
      domains = [domains]
    }

    const unresolved = domains.filter(d => !this.addresses[d])
    if (unresolved.length) {
      const resolved = await aggregator.methods.bulkResolve(unresolved.map(ens.hash)).call()
      for (let i = 0; i < resolved.length; i++) {
        this.addresses[domains[i]] = resolved[i]
      }
    }

    const addresses = domains.map(domain => this.addresses[domain])
    return addresses.length === 1 ? addresses[0] : addresses
  }
}

module.exports = ENSResolver
