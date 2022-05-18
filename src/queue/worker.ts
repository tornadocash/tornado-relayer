import { getRelayerWorker, getSchedulerWorker } from './';
import { configService, getPriceService } from '../services';


export const schedulerWorker = async () => {
  await configService.init();
  const priceService = getPriceService();
  const schedulerWorkerWorker = getSchedulerWorker();
  console.log('price worker');
  schedulerWorkerWorker.on('active', () => console.log('worker active'));
  schedulerWorkerWorker.on('completed', async (job, result) => {
    if (job.name === 'updatePrices') {
      // await priceService.savePrices(result);
    }
  });
  schedulerWorkerWorker.on('failed', (job, error) => console.log(error));
};

export const relayerWorker = async () => {
  const relayerWorker = getRelayerWorker();
  relayerWorker.on('completed', (job, result) => console.log(result));
  relayerWorker.on('failed', (job, error) => console.log(error));
};
