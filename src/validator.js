const { isAddress, toChecksumAddress } = require('web3-utils')
const { getInstance } = require('./utils')
const { rewardAccount } = require('./config')

const Ajv = require('ajv')
const ajv = new Ajv({ format: 'fast' })

ajv.addKeyword('isAddress', {
  validate: (schema, data) => {
    try {
      return isAddress(data)
    } catch (e) {
      return false
    }
  },
  errors: true,
})

ajv.addKeyword('isKnownContract', {
  validate: (schema, data) => {
    try {
      return getInstance(data) !== null
    } catch (e) {
      return false
    }
  },
  errors: true,
})

ajv.addKeyword('isFeeRecipient', {
  validate: (schema, data) => {
    try {
      return toChecksumAddress(rewardAccount) === toChecksumAddress(data)
    } catch (e) {
      return false
    }
  },
  errors: true,
})

const addressType = { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$', isAddress: true }
const proofType = { type: 'string', pattern: '^0x[a-fA-F0-9]{512}$' }
const encryptedAccountType = { type: 'string', pattern: '^0x[a-fA-F0-9]{392}$' }
const bytes32Type = { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' }
const instanceType = { ...addressType, isKnownContract: true }
const relayerType = { ...addressType, isFeeRecipient: true }

const tornadoWithdrawSchema = {
  type: 'object',
  properties: {
    proof: proofType,
    contract: instanceType,
    args: {
      type: 'array',
      maxItems: 6,
      minItems: 6,
      items: [bytes32Type, bytes32Type, addressType, relayerType, bytes32Type, bytes32Type],
    },
  },
  additionalProperties: false,
  required: ['proof', 'contract', 'args'],
}

const miningRewardSchema = {
  type: 'object',
  properties: {
    proof: proofType,
    args: {
      type: 'object',
      properties: {
        rate: bytes32Type,
        fee: bytes32Type,
        instance: instanceType,
        rewardNullifier: bytes32Type,
        extDataHash: bytes32Type,
        depositRoot: bytes32Type,
        withdrawalRoot: bytes32Type,
        extData: {
          type: 'object',
          properties: {
            relayer: relayerType,
            encryptedAccount: encryptedAccountType,
          },
          additionalProperties: false,
          required: ['relayer', 'encryptedAccount'],
        },
        account: {
          type: 'object',
          properties: {
            inputRoot: bytes32Type,
            inputNullifierHash: bytes32Type,
            outputRoot: bytes32Type,
            outputPathIndices: bytes32Type,
            outputCommitment: bytes32Type,
          },
          additionalProperties: false,
          required: [
            'inputRoot',
            'inputNullifierHash',
            'outputRoot',
            'outputPathIndices',
            'outputCommitment',
          ],
        },
      },
      additionalProperties: false,
      required: [
        'rate',
        'fee',
        'instance',
        'rewardNullifier',
        'extDataHash',
        'depositRoot',
        'withdrawalRoot',
        'extData',
        'account',
      ],
    },
  },
  additionalProperties: false,
  required: ['proof', 'args'],
}

const miningWithdrawSchema = {
  type: 'object',
  properties: {
    proof: proofType,
    args: {
      type: 'object',
      properties: {
        amount: bytes32Type,
        extDataHash: bytes32Type,
        extData: {
          type: 'object',
          properties: {
            fee: bytes32Type,
            recipient: addressType,
            relayer: relayerType,
            encryptedAccount: encryptedAccountType,
          },
          additionalProperties: false,
          required: ['fee', 'relayer', 'encryptedAccount', 'recipient'],
        },
        account: {
          type: 'object',
          properties: {
            inputRoot: bytes32Type,
            inputNullifierHash: bytes32Type,
            outputRoot: bytes32Type,
            outputPathIndices: bytes32Type,
            outputCommitment: bytes32Type,
          },
          additionalProperties: false,
          required: [
            'inputRoot',
            'inputNullifierHash',
            'outputRoot',
            'outputPathIndices',
            'outputCommitment',
          ],
        },
      },
      additionalProperties: false,
      required: ['amount', 'extDataHash', 'extData', 'account'],
    },
  },
  additionalProperties: false,
  required: ['proof', 'args'],
}

const validateTornadoWithdraw = ajv.compile(tornadoWithdrawSchema)
const validateMiningReward = ajv.compile(miningRewardSchema)
const validateMiningWithdraw = ajv.compile(miningWithdrawSchema)

function getInputError(validator, data) {
  validator(data)
  if (validator.errors) {
    const error = validator.errors[0]
    return `${error.dataPath} ${error.message}`
  }
  return null
}

function getTornadoWithdrawInputError(data) {
  return getInputError(validateTornadoWithdraw, data)
}

function getMiningRewardInputError(data) {
  return getInputError(validateMiningReward, data)
}

function getMiningWithdrawInputError(data) {
  return getInputError(validateMiningWithdraw, data)
}

module.exports = {
  getTornadoWithdrawInputError,
  getMiningRewardInputError,
  getMiningWithdrawInputError,
}
