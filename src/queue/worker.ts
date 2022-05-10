import { redis } from '../modules';
import { Worker } from 'bullmq';

const connection = redis.getClient();

const worker = new Worker('proof', async (job) => {
  // do some processing
}, { connection });
