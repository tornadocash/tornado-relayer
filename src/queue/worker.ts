import { getPriceWorker, getRelayerWorker } from './';


export default async () => {
  const priceWorker = getPriceWorker();
  priceWorker.on('completed', (job, result) => console.log(result));
  priceWorker.on('failed', (job, error) => console.log(error));

  const relayerWorker = getRelayerWorker();
  relayerWorker.on('completed', (job, result) => console.log(result));
  relayerWorker.on('failed', (job, error) => console.log(error));
};
