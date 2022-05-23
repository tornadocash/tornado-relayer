import { instances, minimumBalance, netId, privateKey, rpcUrl, torn, tornadoGoerliProxy, tornToken } from '../config';
import { Token } from '../types';
import { getProvider, getTornadoProxyContract, getTornadoProxyLightContract } from '../modules/contracts';
import { resolve } from '../modules';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { availableIds, netIds, NetInstances } from '../../../torn-token';
import { getAddress } from 'ethers/lib/utils';
import { providers, Wallet } from 'ethers';
import { container, singleton } from 'tsyringe';

type relayerQueueName = `relayer_${availableIds}`

@singleton()
export class ConfigService {
  static instance: ConfigService;
  netIdKey: netIds;
  queueName: relayerQueueName;
  tokens: Token[];
  private _proxyAddress: string;
  private _proxyContract: TornadoProxyABI | ProxyLightABI;
  addressMap = new Map<string, InstanceProps>();
  isLightMode: boolean;
  instances: NetInstances;
  provider: providers.JsonRpcProvider;
  wallet: Wallet;
  public readonly netId: availableIds = netId;
  public readonly privateKey = privateKey;
  public readonly rpcUrl = rpcUrl;
  isInit: boolean;

  constructor() {
    this.netIdKey = `netId${this.netId}`;
    this.queueName = `relayer_${this.netId}`;
    this.isLightMode = ![1, 5].includes(netId);
    this.instances = instances[this.netIdKey];
    this.provider = getProvider(false);
    this.wallet = new Wallet(this.privateKey, this.provider);
    console.log(this.wallet.address);
    this._fillInstanceMap();
  }

  get proxyContract(): TornadoProxyABI | ProxyLightABI {
    return this._proxyContract;
  }

  get proxyAddress(): string {
    return this._proxyAddress;
  }

  private _fillInstanceMap() {
    if (!this.instances) throw new Error('config mismatch, check your environment variables');
    // TODO
    for (const [currency, { instanceAddress, symbol, decimals }] of Object.entries(this.instances)) {
      Object.entries(instanceAddress).forEach(([amount, address]) => {
          if (address) {
            this.addressMap.set(getAddress(address), {
              currency,
              amount,
              symbol,
              decimals,
            });
          }
        },
      );
    }
  }

  private async _checkNetwork() {
    try {
      await this.provider.getNetwork();
    } catch (e) {
      throw new Error(`Could not detect network, check your rpc url: ${this.rpcUrl}. ` + e.message);
    }
  }

  async init() {
    try {
      if (this.isInit) return;
      await this._checkNetwork();
      if (this.isLightMode) {
        this._proxyAddress = await resolve(torn.tornadoProxyLight.address);
        this._proxyContract = getTornadoProxyLightContract(this._proxyAddress);
      } else {
        this._proxyAddress = tornadoGoerliProxy;
        if (this.netId === 1) {
          this._proxyAddress = await resolve(torn.tornadoRouter.address);
        }
        this._proxyContract = getTornadoProxyContract(this._proxyAddress);
      }
      // TODO get instances from registry

      this.tokens = [tornToken, ...Object.values(torn.instances['netId1'])]
        .map<Token>(el => (el.tokenAddress && {
          address: getAddress(el.tokenAddress),
          decimals: el.decimals,
          symbol: el.symbol,
        })).filter(Boolean);
      console.log(
        `Configuration completed\n-- netId: ${this.netId}\n-- rpcUrl: ${this.rpcUrl}`);
      this.isInit = true;
    } catch (e) {
      console.error(`${this.constructor.name} Error:`, e.message);
    }
  }

  getInstance(address: string) {
    return this.addressMap.get(getAddress(address));
  }

  async getBalance() {
    const balance = await this.wallet.getBalance();
    const isEnougth = balance.gt(minimumBalance);
    return { balance, isEnougth };
  }

}

type InstanceProps = {
  currency: string,
  amount: string,
  symbol: string,
  decimals: number,
}

export default container.resolve(ConfigService);
