import Redis from 'ioredis';
import { redisUrl } from '../config';

const redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisSubscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });

export const getClient = () => redisClient.on('error', (error) => {
  throw error;
});
export const getSubscriber = () => redisSubscriber;

export default { getClient, getSubscriber };
