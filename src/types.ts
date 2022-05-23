export enum RelayerJobType {
  TORNADO_WITHDRAW = 'TORNADO_WITHDRAW',
  MINING_REWARD = 'MINING_REWARD',
  MINING_WITHDRAW = 'MINING_WITHDRAW',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  ACCEPTED = 'ACCEPTED',
  SENT = 'SENT',
  MINED = 'MINED',
  RESUBMITTED = 'RESUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export type Token = { address: string, decimals: number, symbol?: string }
