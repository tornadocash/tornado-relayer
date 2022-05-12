import { Queue, Worker } from 'bullmq';
import { redis } from '../modules';
import { priceProcessor } from './priceProcessor';
import { Token } from '../types';
import { netId } from '../config';
import { relayerProcessor } from './relayerProcessor';

const connection = redis.getClient();

export const priceQueue = new Queue<Token[], any>('price', { connection });
export const getPriceWorker = () => new Worker(priceQueue.name, priceProcessor, { connection });

export const relayerQueue = new Queue(`relayer_${netId}`, { connection });
export const getRelayerWorker = () => new Worker(relayerQueue.name, relayerProcessor, { connection });
