import { getMultiCallContract, getOffchainOracleContract } from '../modules/contracts';
import { MulticallAbi, OffchainOracleAbi } from '../../contracts';
import { MultiCall } from '../../contracts/MulticallAbi';
import { BigNumber } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { Token } from '../types';
import { container, injectable } from 'tsyringe';
import { RedisStore } from '../modules/redis';

@injectable()
export class PriceService {
  private oracle: OffchainOracleAbi;
  private multiCall: MulticallAbi;

  constructor(private store: RedisStore) {
    this.oracle = getOffchainOracleContract();
    this.multiCall = getMultiCallContract();
  }

  prepareCallData(tokens: Token[]): MultiCall.CallStruct[] {
    return tokens.map((token) => ({
      to: this.oracle.address,
      data: this.oracle.interface.encodeFunctionData('getRateToEth',
        [token.address, true],
      ),
    }));
  }

  async fetchPrices(tokens: Token[]) {
    const names = tokens.reduce((p, c) => {
      p[c.address] = c.symbol.toLowerCase();
      return p;
    }, {});
    const callData = this.prepareCallData(tokens);
    const { results, success } = await this.multiCall.multicall(callData);
    const prices: Record<string, string> = {};
    for (let i = 0; i < results.length; i++) {
      if (!success[i]) {
        continue;
      }
      const decodedRate = defaultAbiCoder.decode(['uint256'], results[i]).toString();
      const numerator = BigNumber.from(10).pow(tokens[i].decimals);
      const denominator = BigNumber.from(10).pow(18); // eth decimals
      const price = BigNumber.from(decodedRate).mul(numerator).div(denominator);
      prices[names[tokens[i].address]] = price.toString();
    }
    return prices;
  }

  async getPrice(currency: string) {
    return await this.store.client.hget('prices', currency);
  }

  async getPrices() {
    return await this.store.client.hgetall('prices');
  }

  async savePrices(prices: Record<string, string>) {
    return await this.store.client.hset('prices', prices);
  }
}

export default () => container.resolve(PriceService);
