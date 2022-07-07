import { Processor, Queue, QueueScheduler, Worker } from 'bullmq';
import { TransactionReceipt } from '@ethersproject/abstract-provider';
import { JobStatus, RelayerJobType, Token } from '../types';
import { WithdrawalData } from '../services/tx.service';
import { priceProcessor } from './price.processor';
import { autoInjectable } from 'tsyringe';
import { RedisStore } from '../modules/redis';
import { ConfigService } from '../services/config.service';
import { relayerProcessor } from './relayer.processor';
import { healthProcessor } from './health.processor';
import { txJobAttempts } from '../config';

type PriceJobData = Token[];
type PriceJobReturn = number;

type HealthJobReturn = void;
type HealthJobData = null;

export type RelayerJobData = WithdrawalData & {
  id: string;
  status: JobStatus;
  type: RelayerJobType;
  txHash?: string;
  confirmations?: number;
};
export type RelayerJobReturn = TransactionReceipt;

export type RelayerProcessor = Processor<RelayerJobData, RelayerJobReturn, RelayerJobType>;
export type PriceProcessor = Processor<PriceJobData, PriceJobReturn, 'updatePrice'>;

@autoInjectable()
export class PriceQueueHelper {
  _queue: Queue<PriceJobData, PriceJobReturn, 'updatePrice'>;
  _worker: Worker<PriceJobData, PriceJobReturn, 'updatePrice'>;
  _scheduler: QueueScheduler;
  interval = 30000;

  constructor(private store?: RedisStore) {}

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
      this._scheduler = new QueueScheduler('price', {
        connection: this.store.client,
      });
    }
    return this._scheduler;
  }

  async addRepeatable(tokens: PriceJobData) {
    await this.queue.add('updatePrice', tokens, {
      repeat: {
        every: this.interval,
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

  constructor(private store?: RedisStore, private config?: ConfigService) {}

  get queue() {
    if (!this._queue) {
      this._queue = new Queue<RelayerJobData, RelayerJobReturn, RelayerJobType>(this.config.queueName, {
        connection: this.store.client,
        defaultJobOptions: {
          stackTraceLimit: 100,
          attempts: txJobAttempts,
          backoff: 1000,
        },
      });
    }
    return this._queue;
  }

  get worker() {
    if (!this._worker) {
      this._worker = new Worker<RelayerJobData, RelayerJobReturn, RelayerJobType>(this.config.queueName, relayerProcessor, {
        connection: this.store.client,
        concurrency: 1,
      });
    }
    return this._worker;
  }

  get scheduler() {
    if (!this._scheduler) {
      this._scheduler = new QueueScheduler(this.config.queueName, {
        connection: this.store.client,
      });
    }
    return this._scheduler;
  }
}

@autoInjectable()
export class HealthQueueHelper {
  private _queue: Queue<HealthJobData, HealthJobReturn, 'checkHealth'>;
  private _worker: Worker<HealthJobData, HealthJobReturn, 'checkHealth'>;
  private _scheduler: QueueScheduler;
  interval = 30000;

  constructor(private store?: RedisStore) {}

  get scheduler(): QueueScheduler {
    if (!this._scheduler) {
      this._scheduler = new QueueScheduler('health', {
        connection: this.store.client,
      });
    }
    return this._scheduler;
  }

  get worker() {
    if (!this._worker) {
      this._worker = new Worker<HealthJobData, HealthJobReturn, 'checkHealth'>('health', healthProcessor, {
        connection: this.store.client,
        concurrency: 1,
      });
    }
    return this._worker;
  }

  get queue() {
    if (!this._queue) {
      this._queue = new Queue<HealthJobData, HealthJobReturn, 'checkHealth'>('health', {
        connection: this.store.client,
        defaultJobOptions: { stackTraceLimit: 100 },
      });
    }
    return this._queue;
  }

  async addRepeatable() {
    await this.queue.add('checkHealth', null, {
      repeat: {
        every: this.interval,
        immediately: true,
      },
    });
  }
}
