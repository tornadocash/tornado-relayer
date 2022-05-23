import 'reflect-metadata';
import { PriceQueueHelper, RelayerQueueHelper } from './';
import { configService } from '../services';


export const schedulerWorker = async () => {
  await configService.init();
  const price = new PriceQueueHelper();
  console.log('price worker', price.queue.name);
  price.worker.on('active', () => console.log('worker active'));
  price.worker.on('completed', async (job, result) => {
    console.log(`Job ${job.id} completed with result: ${result}`);
  });
  price.worker.on('failed', (job, error) => console.log(error));
};

export const relayerWorker = async () => {
  await configService.init();
  const relayer = new RelayerQueueHelper();
  console.log(relayer.queue.name, 'worker started');
  relayer.worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result: `, result);
  });
  relayer.worker.on('failed', (job, error) => console.log(error));
};
