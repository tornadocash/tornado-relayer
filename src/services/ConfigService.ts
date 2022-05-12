import { instances, netId, torn, tornadoGoerliProxy, tornToken } from '../config';
import { Token } from '../types';
import { getProvider, getTornadoProxyContract, getTornadoProxyLightContract } from '../modules/contracts';
import { EnsResolver } from '../modules';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { availableIds, netIds } from '../../../torn-token';
import { getAddress } from 'ethers/lib/utils';

const resolver = new EnsResolver(getProvider());


export class ConfigService {
  static instance: ConfigService;
  netId: availableIds;
  netIdKey: netIds;
  tokens: Token[];
  private _proxyAddress: string;
  private _proxyContract: TornadoProxyABI | ProxyLightABI;
  addressMap = new Map<string, InstanceProps>();
  isLightMode: boolean;

  constructor() {
    this.netId = netId;
    this.netIdKey = `netId${this.netId}`;
    this.isLightMode = ![1, 5].includes(netId);

    for (const [currency, { instanceAddress, symbol, decimals }] of Object.entries(instances[this.netIdKey])) {
      Object.entries(instanceAddress).forEach(([amount, address]) =>
        this.addressMap.set(getAddress(address), {
          currency,
          amount,
          symbol,
          decimals,
        }),
      );
    }
  }

  get proxyContract(): TornadoProxyABI | ProxyLightABI {
    return this._proxyContract;
  }

  get proxyAddress(): string {
    return this._proxyAddress;
  }

  async init() {
    if (this.isLightMode) {
      this._proxyAddress = await resolver.resolve(torn.tornadoProxyLight.address);
      this._proxyContract = getTornadoProxyLightContract();
    } else {
      if (this.netIdKey === 'netId1') {
        this._proxyAddress = await resolver.resolve(torn.tornadoRouter.address);
      } else {
        this._proxyAddress = tornadoGoerliProxy;
      }
      this._proxyContract = getTornadoProxyContract();
      this.tokens = [tornToken, ...Object.values(torn.instances['netId1'])]
        .map<Token>(el => ({
          address: getAddress(el.tokenAddress),
          ...el,
        })).filter(e => e.address);
    }
  }

  getInstance(address: string) {
    return this.addressMap.get(getAddress(address));
  }

  public static getServiceInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

type InstanceProps = {
  currency: string,
  amount: string,
  symbol: string,
  decimals: number,
}

export default ConfigService.getServiceInstance();
