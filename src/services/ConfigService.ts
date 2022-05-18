import {
  httpRpcUrl,
  instances,
  minimumBalance,
  netId,
  privateKey,
  torn,
  tornadoGoerliProxy,
  tornToken,
} from '../config';
import { Token } from '../types';
import { getProvider, getTornadoProxyContract, getTornadoProxyLightContract } from '../modules/contracts';
import { resolve } from '../modules';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { availableIds, netIds, NetInstances } from '../../../torn-token';
import { getAddress } from 'ethers/lib/utils';
import { providers, Wallet } from 'ethers';

type relayerQueueName = `relayer_${availableIds}`

export class ConfigService {
  static instance: ConfigService;
  netId: availableIds;
  netIdKey: netIds;
  queueName: relayerQueueName;
  tokens: Token[];
  privateKey: string;
  rpcUrl: string;
  private _proxyAddress: string;
  private _proxyContract: TornadoProxyABI | ProxyLightABI;
  addressMap = new Map<string, InstanceProps>();
  isLightMode: boolean;
  instances: NetInstances;
  provider: providers.StaticJsonRpcProvider;
  wallet: Wallet;

  constructor() {
    this.netId = netId;
    this.netIdKey = `netId${this.netId}`;
    this.queueName = `relayer_${this.netId}`;
    this.isLightMode = ![1, 5].includes(netId);
    this.privateKey = privateKey;
    this.rpcUrl = httpRpcUrl;
    this.instances = instances[this.netIdKey];
    this.provider = getProvider(false);
    this.wallet = new Wallet(this.privateKey, this.provider);
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
      throw new Error(`Could not detect network, check your rpc url: ${this.rpcUrl}`);
    }
  }

  async init() {
    try {
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
        this.tokens = [tornToken, ...Object.values(torn.instances['netId1'])]
          .map<Token>(el => (el.tokenAddress && {
            address: getAddress(el.tokenAddress),
            ...el,
          })).filter(Boolean);
        console.log(
          `Configuration completed\n-- netId: ${this.netId}\n-- rpcUrl: ${this.rpcUrl}`);
      }
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

  public static getServiceInstance() {
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
