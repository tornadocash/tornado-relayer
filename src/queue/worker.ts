import 'reflect-metadata';
import { HealthQueueHelper, PriceQueueHelper, RelayerQueueHelper } from './';
import { configService, getHealthService } from '../services';

export const priceWorker = async () => {
  await configService.init();
  if (configService.isLightMode) return;
  const healthService = getHealthService();

  const price = new PriceQueueHelper();
  console.log(price.queue.name, 'worker started');

  price.scheduler.on('stalled', (jobId, prev) => console.log({ jobId, prev }));
  price.worker.on('active', () => console.log('worker active'));
  price.worker.on('completed', async (job, result) => {
    console.log(`Job ${job.name} completed with result: `, result);
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
    console.log(`Failed job ${job.id}: `, error);
  });
  relayer.scheduler.on('stalled', (jobId, prev) => console.log({ jobId, prev }));
};

export const healthWorker = async () => {
  await configService.init();
  const health = new HealthQueueHelper();
  console.log(health.queue.name, 'worker started');

  health.scheduler.on('stalled', (jobId, prev) => console.log({ jobId, prev }));
  health.worker.on('completed', (job, result) => {
    console.log(`Job ${job.name} completed with result: `, result);
  });
  health.worker.on('failed', (job, error) => {
    console.log(`Failed job ${job.id}: `, error);
  });
};
