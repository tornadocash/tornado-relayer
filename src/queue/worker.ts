import 'reflect-metadata';
import { HealthQueueHelper, PriceQueueHelper, RelayerQueueHelper } from './';
import { configService, getHealthService } from '../services';

export const priceWorker = async () => {
  await configService.init();
  const healthService = getHealthService();

  const price = new PriceQueueHelper();
  price.scheduler.on('stalled', (jobId, prev) => console.log({ jobId, prev }));
  console.log('price worker', price.queue.name);
  price.worker.on('active', () => console.log('worker active'));
  price.worker.on('completed', async (job, result) => {
    console.log(`Job ${job.id} completed with result: ${result}`);
  });
  price.worker.on('failed', (job, error) => healthService.saveError(error));
};

export const relayerWorker = async () => {
  await configService.init();
  const relayer = new RelayerQueueHelper();
  const healthService = getHealthService();
  console.log(relayer.queue.name, 'worker started');
  relayer.worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result: `, result);
  });
  relayer.worker.on('failed', (job, error) => {
    healthService.saveError(error, job.id);
    console.log(error);
  });
};

export const healthWorker = async () => {
  await configService.init();
  const health = new HealthQueueHelper();
  health.scheduler.on('stalled', (jobId, prev) => console.log({ jobId, prev }));
  console.log(health.queue.name, 'worker started');
  health.worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result: `, result);
  });
  health.worker.on('failed', (job, error) => {
    console.log(error);
  });
};
