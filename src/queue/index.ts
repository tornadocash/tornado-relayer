import { Job, Processor, Queue, Worker } from 'bullmq';
import { redis } from '../modules';
import { JobStatus, JobType, Token } from '../types';
import { relayerProcessor } from './relayerProcessor';
import { WithdrawalData } from '../services/TxService';
import { schedulerProcessor } from './schedulerProcessor';
import { configService } from '../services';
import { BigNumber } from 'ethers';

const connection = redis.getClient();

export type SchedulerJobProcessors = {
  updatePrices: Processor,
  checkBalance: Processor
}

type SchedulerJobName = keyof SchedulerJobProcessors
type SchedulerJobData = Token[] | null
type SchedulerJobReturn = Record<string, string> | { balance: BigNumber, isEnought: boolean }
type RelayerJobData = WithdrawalData & { id: string, status: JobStatus, type: JobType }
type RelayerJobReturn = void

// export interface SchedulerProcessor {
//   <U extends SchedulerJobName>(job: Job<SchedulerJobData, SchedulerJobReturn, U>): SchedulerJobProcessors[U];
//
// }


export interface RelayerProcessor {
  (job: Job<RelayerJobData, RelayerJobReturn, JobType>): Promise<void>;
}

export const schedulerQueue = new Queue<Token[], any, SchedulerJobName>('scheduler', {
  connection,
  defaultJobOptions: {
    removeOnFail: 10,
    removeOnComplete: 10,
  },
});
export const getSchedulerWorker = () => new Worker<SchedulerJobData, SchedulerJobReturn, SchedulerJobName>(schedulerQueue.name, (job) => schedulerProcessor(job), {
  connection,
  concurrency: 3,
});

export const relayerQueue = new Queue<RelayerJobData, RelayerJobReturn, JobType>(configService.queueName, { connection });
export const getRelayerWorker = () => new Worker<RelayerJobData, RelayerJobReturn, JobType>(relayerQueue.name, relayerProcessor, { connection });


