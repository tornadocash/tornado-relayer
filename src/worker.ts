import { schedulerWorker, relayerWorker } from './queue/worker';

schedulerWorker();
relayerWorker();
