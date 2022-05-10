import { netId, torn, tornadoGoerliProxy } from '../config';
import { Token } from '../types';
import { getProvider } from '../modules/contracts';
import { EnsResolver } from '../modules';

const tornToken = {
  tokenAddress: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
  symbol: 'TORN',
  decimals: 18,
};

export class ConfigService {
  get proxyAddress(): string {
    if (!this._proxyAddress) {
      this.init().then(() =>
        this._proxyAddress);
    }
    return this._proxyAddress;
  }

  tokens: Token[];
  private _proxyAddress: string;

  constructor() {
    this.tokens = [tornToken, ...Object.values(torn.instances.netId1)].map<Token>(el => ({
      address: el.tokenAddress,
      ...el,
    })).filter(e => e.address);
  }

  async init() {
    const provider = getProvider();
    const resolver = new EnsResolver(provider);
    if (netId === 5) {
      this._proxyAddress = tornadoGoerliProxy;
    } else {
      this._proxyAddress = await resolver.resolve(torn.tornadoRouter.address);
    }
  }
}

export default new ConfigService();
