import { Processor, Queue, QueueScheduler, Worker } from 'bullmq';
import { JobStatus, RelayerJobType, Token } from '../types';
import { WithdrawalData } from '../services/tx.service';
import { BigNumber } from 'ethers';
import { priceProcessor } from './price.processor';
import { autoInjectable } from 'tsyringe';
import { RedisStore } from '../modules/redis';
import { ConfigService } from '../services/config.service';
import { relayerProcessor } from './relayer.processor';

type PriceJobData = Token[]
type PriceJobReturn = number
type HealthJobReturn = { balance: BigNumber, isEnought: boolean }

type RelayerJobData = WithdrawalData & { id: string, status: JobStatus, type: RelayerJobType }

type RelayerJobReturn = any

export type RelayerProcessor = Processor<RelayerJobData, RelayerJobReturn, RelayerJobType>
export type PriceProcessor = Processor<PriceJobData, PriceJobReturn, 'updatePrice'>

@autoInjectable()
export class PriceQueueHelper {
  _queue: Queue<PriceJobData, PriceJobReturn, 'updatePrice'>;
  _worker: Worker<PriceJobData, PriceJobReturn, 'updatePrice'>;
  _scheduler: QueueScheduler;

  constructor(private store?: RedisStore) {
  }

  get queue() {
    if (!this._queue) {
      this._queue = new Queue<Token[], PriceJobReturn, 'updatePrice'>('price', {
        connection: this.store.client,
        defaultJobOptions: {
          removeOnFail: 10,
          removeOnComplete: 10,
        },
      });
    }
    return this._queue;
  }

  get worker() {
    if (!this._worker) {
      this._worker = new Worker<PriceJobData, PriceJobReturn, 'updatePrice'>('price', priceProcessor, {
        connection: this.store.client,
        concurrency: 1,
      });
    }
    return this._worker;
  }

  get scheduler() {
    if (!this._scheduler) {
      this._scheduler = new QueueScheduler('price', { connection: this.store.client });
    }
    return this._scheduler;
  }

  async addRepeatable(tokens: PriceJobData) {
    await this.queue.add('updatePrice', tokens, {
      repeat: {
        every: 30000,
        immediately: true,
      },
    });
  }
}


@autoInjectable()
export class RelayerQueueHelper {
  private _queue: Queue<RelayerJobData, RelayerJobReturn, RelayerJobType>;
  private _worker: Worker<RelayerJobData, RelayerJobReturn, RelayerJobType>;
  private _scheduler: QueueScheduler;

  constructor(private store?: RedisStore, private config?: ConfigService) {
  }

  get queue() {
    if (!this._queue) {
      this._queue = new Queue<RelayerJobData, RelayerJobReturn, RelayerJobType>(this.config.queueName, { connection: this.store.client });
    }
    return this._queue;
  }

  get worker() {
    if (!this._worker) {
      this._worker = new Worker<RelayerJobData, RelayerJobReturn, RelayerJobType>(this.config.queueName, relayerProcessor, { connection: this.store.client });
    }
    return this._worker;
  }

  get scheduler() {
    if (!this._scheduler) {
      this._scheduler = new QueueScheduler(this.config.queueName, { connection: this.store.client });
    }
    return this._scheduler;
  }


}


