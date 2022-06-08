import IORedis, { Redis } from 'ioredis';
import { redisUrl } from '../config';
import { container, singleton } from 'tsyringe';

const getNewInstance: () => Redis = () => new IORedis(redisUrl, { maxRetriesPerRequest: null });

@singleton()
export class RedisStore {
  get publisher(): Redis {
    if (!this._publisher) {
      this._publisher = getNewInstance();
    }
    return this._publisher;
  }

  get client() {
    if (!this._client) {
      this._client = getNewInstance();
    }
    return this._client;
  }

  get subscriber() {
    if (!this._subscriber) {
      this._subscriber = getNewInstance();
    }
    return this._subscriber;
  }

  private _subscriber: Redis;
  private _publisher: Redis;
  private _client: Redis;

}

export default () => container.resolve(RedisStore);