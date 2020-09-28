const { isHexStrict } = require('web3-utils')
const { getInstance } = require('./utils')
const { rewardAccount } = require('../config')

function getProofError(proof) {
  if (!proof) {
    return 'The proof is empty'
  }

  if (!isHexStrict(proof) || proof.length !== 2 + 2 * 8 * 32) {
    return 'Corrupted proof'
  }

  return null
}

function getArgsError(args, expectedLengths) {
  if (!args) {
    return 'Args are empty'
  }

  if (!Array.isArray(args)) {
    return 'Args should be an array'
  }

  if (args.length !== expectedLengths.length) {
    return `Expected ${expectedLengths.length} args`
  }

  for (let i = 0; i < args.length; i++) {
    if (!isHexStrict(args[i])) {
      return `Corrupted signal ${i}: ${args[i]}`
    }
    if (args[i].length !== 2 + expectedLengths * 20) {
      return `Signal ${i} has invalid length: ${args[i]}`
    }
  }

  return null
}

function getContractError(contract) {
  if (!contract) {
    return 'The contract is empty'
  }

  if (!isHexStrict(contract) || contract.length !== 42) {
    return 'Corrupted contract'
  }

  if (!getInstance(contract)) {
    return `This relayer does not support the token: ${contract}`
  }

  return null
}

function getRewardAddressError(address) {
  if (address.toLowerCase() !== rewardAccount.toLowerCase()) {
    return 'This proof is for different relayer'
  }

  return null
}

function getWithdrawInputError(input) {
  return getProofError(input.proof) || getArgsError(input.args, [32, 32, 20, 20, 32, 32]) || getContractError(input.contract) || getRewardAddressError(input.args[3])
}

function getClaimInputError(input) {
  return getProofError(input.proof) || getArgsError(input.args, [32, 32, 20, 20, 32, 32])
}

function getRewardInputError(input) {
  return getProofError(input.proof) || getArgsError(input.args, [32, 32, 20, 20, 32, 32])
}


module.exports = {
  getWithdrawInputError,
  getClaimInputError,
  getRewardInputError,
}
