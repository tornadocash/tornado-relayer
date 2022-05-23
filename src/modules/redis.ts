import Redis from 'ioredis';
import { redisUrl } from '../config';
import { container, singleton } from 'tsyringe';

@singleton()
export class RedisStore {
  get client(): Redis.Redis {
    return this._client;
  }

  get subscriber(): Redis.Redis {
    return this._subscriber;
  }

  private readonly _subscriber: Redis.Redis;
  private readonly _client: Redis.Redis;

  constructor() {
    this._client = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this._subscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });
    console.log('RedisStore new instance');
  }
}

export default () => container.resolve(RedisStore);
