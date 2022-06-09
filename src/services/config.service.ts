import {
  instances,
  minimumBalance,
  minimumTornBalance,
  netId,
  networkConfig,
  privateKey,
  rpcUrl,
  torn,
  tornadoGoerliProxy,
  tornToken,
} from '../config';
import { Token } from '../types';
import {
  getProvider,
  getTornadoProxyContract,
  getTornadoProxyLightContract,
  getTornTokenContract,
} from '../modules/contracts';
import { resolve } from '../modules';
import { ERC20Abi, ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { availableIds, netIds, NetInstances } from '../../../torn-token';
import { getAddress } from 'ethers/lib/utils';
import { BigNumber, providers, Wallet } from 'ethers';
import { container, singleton } from 'tsyringe';
import { GasPrice } from 'gas-price-oracle/lib/types';
import { RedisStore } from '../modules/redis';

type relayerQueueName = `relayer_${availableIds}`

@singleton()
export class ConfigService {
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
  nativeCurrency: string;
  fallbackGasPrices: GasPrice;
  private _tokenAddress: string;
  private _tokenContract: ERC20Abi;
  balances: { MAIN: { warn: string; critical: string; }; TORN: { warn: string; critical: string; }; };


  constructor(private store: RedisStore) {
    this.netIdKey = `netId${this.netId}`;
    this.queueName = `relayer_${this.netId}`;
    this.isLightMode = ![1, 5].includes(netId);
    this.instances = instances[this.netIdKey];
    this.provider = getProvider(false);
    this.wallet = new Wallet(this.privateKey, this.provider);
    this.balances = {
      MAIN: { warn: BigNumber.from(minimumBalance).mul(150).div(100).toString(), critical: minimumBalance },
      TORN: { warn: BigNumber.from(minimumTornBalance).mul(2).toString(), critical: minimumTornBalance },
    };
    this._fillInstanceMap();
  }

  get proxyContract(): TornadoProxyABI | ProxyLightABI {
    return this._proxyContract;
  }

  get tokenContract(): ERC20Abi {
    return this._tokenContract;
  }

  private _fillInstanceMap() {
    if (!this.instances) throw new Error('config mismatch, check your environment variables');
    // TODO
    for (const [currency, { instanceAddress, symbol, decimals }] of Object.entries(this.instances)) {
      for (const [amount, address] of Object.entries(instanceAddress)) {
        if (address) this.addressMap.set(getAddress(address), {
          currency, amount, symbol, decimals,
        });
      }
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
      this._tokenAddress = await resolve(torn.torn.address);
      this._tokenContract = await getTornTokenContract(this._tokenAddress);
      if (this.isLightMode) {
        this._proxyAddress = torn.tornadoProxyLight.address;
        this._proxyContract = getTornadoProxyLightContract(this._proxyAddress);
        const { gasPrices, nativeCurrency } = networkConfig[this.netIdKey];
        this.nativeCurrency = nativeCurrency;
        this.fallbackGasPrices = gasPrices;
      } else {
        this._proxyAddress = tornadoGoerliProxy;
        this.nativeCurrency = 'eth';
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
        'Configuration completed\n',
        `-- netId: ${this.netId}\n`,
        `-- rpcUrl: ${this.rpcUrl}\n`,
        `-- relayer Address: ${this.wallet.address}\n`,
      );
      this.isInit = true;
    } catch (e) {
      console.error(`${this.constructor.name} Error:`, e.message);
    }
  }

  async clearRedisState() {
    const queueKeys = (await this.store.client.keys('bull:*')).filter(s => s.indexOf('relayer') === -1);
    await this.store.client.del(queueKeys);
  }

  getInstance(address: string) {
    return this.addressMap.get(getAddress(address));
  }

}

type InstanceProps = {
  currency: string,
  amount: string,
  symbol: string,
  decimals: number,
}

export default container.resolve(ConfigService);
