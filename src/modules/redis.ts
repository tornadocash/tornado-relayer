import Redis from 'ioredis';
import { redisUrl } from '../config';

const redisClient = new Redis(redisUrl);
const redisSubscriber = new Redis(redisUrl);

export const getClient = () => redisClient;
export const getSubscriber = () => redisSubscriber;

export default { getClient, getSubscriber };
