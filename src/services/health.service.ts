import { autoInjectable, container } from 'tsyringe';
import { ConfigService } from './config.service';
import { RedisStore } from '../modules/redis';
import { formatEther } from 'ethers/lib/utils';

@autoInjectable()
export class HealthService {
  constructor(private config: ConfigService, private store: RedisStore) {
  }

  async clearErrors() {
    await this.store.client.del('errors');
  }

  async getErrors(): Promise<{ message: string, score: number }[]> {
    const set = await this.store.client.zrevrange('errors', 0, -1, 'WITHSCORES');
    const errors = [];
    while (set.length) {
      const [message, score] = set.splice(0, 2);
      errors.push({ message, score });
    }
    return errors;
  }

  async saveError(e) {
    await this.store.client.zadd('errors', 'INCR', 1, e.message);
  }

  private async _checkBalance(value, currency: 'MAIN' | 'TORN') {
    let level = 'OK';
    const type = 'BALANCE';
    const key = 'alerts';
    const time = new Date().getTime();
    if (value.lt(this.config.balances[currency].critical)) {
      level = 'CRITICAL';
    } else if (value.lt(this.config.balances[currency].warn)) {
      level = 'WARN';
    }

    const isSent = await this.store.client.sismember(`${key}:sent`, `${type}_${currency}_${level}`);
    if (!isSent) {
      const alert = {
        type: `${type}_${currency}_${level}`,
        message: `Insufficient balance ${formatEther(value)} ${currency === 'MAIN' ? this.config.nativeCurrency : 'torn'}`,
        level,
        time,
      };
      await this.store.client.rpush(key, JSON.stringify(alert));
    }

  }

  async check() {
    const mainBalance = await this.config.wallet.getBalance();
    const tornBalance = await this.config.tokenContract.balanceOf(this.config.wallet.address);
    // const mainBalance = BigNumber.from(`${2e18}`).add(1);
    // const tornBalance = BigNumber.from(`${50e18}`);
    await this._checkBalance(mainBalance, 'MAIN');
    await this._checkBalance(tornBalance, 'TORN');
  }

}

type HealthData = {
  status: boolean,
  error: string,
  errorsLog: { message: string, score: number }[]
}

export default () => container.resolve(HealthService);
