const addressType = { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$', isAddress: true } as const;
const proofType = { type: 'string', pattern: '^0x[a-fA-F0-9]{512}$' } as const;
// const encryptedAccountType = { type: 'string', pattern: '^0x[a-fA-F0-9]{392}$' } as const;
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
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' },
      },
    },
  },
};
const statusResponseSchema = {
  type: 'object',
  properties: {
    rewardAccount: addressType,
    netId: { type: 'integer' },
    version: { type: 'string' },
    tornadoServiceFee: { type: 'number' },
    miningServiceFee: { type: 'number' },
    currentQueue: { type: 'number' },
    ethPrices: { type: 'object', additionalProperties: true },
    instances: { type: 'object', additionalProperties: true },
    health: { type: 'object', additionalProperties: true },
  },
} as const;

export const statusSchema = {
  response: {
    200: statusResponseSchema,
  },
};
