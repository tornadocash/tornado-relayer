import { healthWorker, priceWorker } from './queue/worker';

priceWorker();
healthWorker();
