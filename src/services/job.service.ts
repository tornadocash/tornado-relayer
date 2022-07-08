import { v4 } from 'uuid';
import { JobStatus, RelayerJobType } from '../types';
import { HealthQueueHelper, PriceQueueHelper, RelayerQueueHelper } from '../queue';
import { WithdrawalData } from './tx.service';
import { container, injectable } from 'tsyringe';
import { ConfigService } from './config.service';

@injectable()
export class JobService {
  constructor(
    private price?: PriceQueueHelper,
    private relayer?: RelayerQueueHelper,
    private health?: HealthQueueHelper,
    public config?: ConfigService,
  ) {}

  async postJob(type: RelayerJobType, data: WithdrawalData) {
    const id = v4();

    const job = await this.relayer.queue.add(
      type,
      {
        id,
        type,
        status: JobStatus.QUEUED,
        ...data,
      },
      { jobId: id },
    );
    return job.id;
  }

  async getJob(jobId: string) {
    return await this.relayer.queue.getJob(jobId);
  }

  async getQueueCount() {
    return await this.relayer.queue.getJobCountByTypes('active', 'waiting', 'delayed');
  }

  async setupRepeatableJobs() {
    if (!this.config.isLightMode) {
      await this.price.addRepeatable(this.config.tokens);
    }
    await this.health.addRepeatable();
  }
}

export default () => container.resolve(JobService);
