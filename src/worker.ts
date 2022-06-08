import { priceWorker, relayerWorker, healthWorker } from './queue/worker';

priceWorker();
relayerWorker();
healthWorker();
