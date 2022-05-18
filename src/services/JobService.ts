import { v4 } from 'uuid';
import { JobStatus, JobType } from '../types';
import { relayerQueue, schedulerQueue } from '../queue';
import { WithdrawalData } from './TxService';
import { getClient } from '../modules/redis';
import { Job } from 'bullmq';
import { configService } from './index';

export class JobService {
  store: ReturnType<typeof getClient>;

  constructor() {
    this.store = getClient();
  }

  async postJob(type: JobType, data: WithdrawalData) {
    const id = v4();

    const job = await relayerQueue.add(
      type,
      {
        id,
        type,
        status: JobStatus.QUEUED,
        ...data,
      },
      {},
    );
    this.save(job);
    return id;
  }

  save(job: Job) {
    return this.store.set(`job:${job.data.id}`, job.id);
  }

  async getJob(id: string) {
    const key = 'job:' + id;
    console.log(key);
    const jobId = await this.store.get(key);
    return await relayerQueue.getJob(jobId);
  }

  async getQueueCount() {
    return await relayerQueue.getJobCountByTypes('active', 'waiting', 'delayed');
  }

  private async _clearSchedulerJobs() {
    const jobs = await schedulerQueue.getJobs();
    await Promise.all(jobs.map(job => schedulerQueue.remove(job.id)));
  }

  async setupRepeatableJobs() {
    await this._clearSchedulerJobs();
    await schedulerQueue.add('updatePrices', configService.tokens, {
      repeat: {
        every: 30000,
        immediately: true,
      },
    });
    await schedulerQueue.add('checkBalance', null, {
      repeat: {
        every: 30000,
        immediately: true,
      },
    });
  }
}

export default () => new JobService();
