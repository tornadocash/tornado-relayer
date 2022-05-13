import { getMultiCallContract, getOffchainOracleContract } from '../modules/contracts';
import { MulticallAbi, OffchainOracleAbi } from '../../contracts';
import { MultiCall } from '../../contracts/MulticallAbi';
import { BigNumber } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import { Token } from '../types';
import { redis } from '../modules';

const redisClient = redis.getClient();

export class PriceService {
  oracle: OffchainOracleAbi;
  multiCall: MulticallAbi;

  constructor() {
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
      p[c.address] = c.symbol;
      return p;
    }, {});
    const callData = this.prepareCallData(tokens);
    const { results, success } = await this.multiCall.multicall(callData);
    const prices: { [p: string]: string } = {};
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

  async getPrice(symbol: string) {
    return await redisClient.hget('prices', symbol);
  }
}

export default new PriceService();
