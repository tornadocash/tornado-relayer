const addressType = { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$', isAddress: true } as const;
const proofType = { type: 'string', pattern: '^0x[a-fA-F0-9]{512}$' } as const;
const encryptedAccountType = { type: 'string', pattern: '^0x[a-fA-F0-9]{392}$' } as const;
const bytes32Type = { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' } as const;
const instanceType = { ...addressType, isKnownContract: true } as const;
const relayerType = { ...addressType, isFeeRecipient: true } as const;

export const withdrawBodySchema = {
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
} as const;

export const withdrawSchema = {
  body: withdrawBodySchema,
  response: {
    200: {
      type: 'boolean',
    },
  },
};
const statusResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string' },
  },
} as const;

export const statusSchema = {
  response: {
    200: statusResponseSchema,
  },
};
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
} as const;

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
};
