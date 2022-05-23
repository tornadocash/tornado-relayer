import { TransactionData, TxManager } from 'tx-manager';
import { GasPriceOracle } from 'gas-price-oracle';
import { Provider } from '@ethersproject/providers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { configService, getPriceService } from './index';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { gasLimits, tornadoServiceFee } from '../config';
import { RelayerJobType } from '../types';
import { PriceService } from './price.service';

export type WithdrawalData = {
  contract: string,
  proof: BytesLike,
  args: [
    BytesLike,
    BytesLike,
    string,
    string,
    BigNumberish,
    BigNumberish
  ]
}

export class TxService {
  txManager: TxManager;
  tornadoProxy: TornadoProxyABI | ProxyLightABI;
  oracle: GasPriceOracle;
  provider: Provider;
  priceService: PriceService;

  constructor() {
    const { privateKey, rpcUrl, netId } = configService;
    this.txManager = new TxManager({ privateKey, rpcUrl });
    this.tornadoProxy = configService.proxyContract;
    this.provider = this.tornadoProxy.provider;
    this.oracle = new GasPriceOracle({ defaultRpc: rpcUrl, chainId: netId });
    this.priceService = getPriceService();
  }

  async sendTx(tx: TransactionData) {
    const currentTx = this.txManager.createTx(tx);

    return await currentTx.send()
      .on('transactionHash', txHash => console.log({ txHash }))
      .on('mined', receipt => console.log('Mined in block', receipt.blockNumber))
      .on('confirmations', confirmations => console.log({ confirmations }));
  }

  async prepareTxData(data: WithdrawalData): Promise<TransactionData> {
    const { contract, proof, args } = data;
    const calldata = this.tornadoProxy.interface.encodeFunctionData('withdraw', [contract, proof, ...args]);
    return {
      value: args[5],
      to: this.tornadoProxy.address,
      data: calldata,
      gasLimit: gasLimits['WITHDRAW_WITH_EXTRA'],
    };
  }

  async checkTornadoFee({ args, contract }: WithdrawalData) {
    const instance = configService.getInstance(contract);
    if (!instance) throw new Error('Instance not found');
    const { currency, amount, decimals } = instance;
    const [fee, refund] = [args[4], args[5]].map(BigNumber.from);
    const gasPrice = await this.getGasPrice();
    // TODO check refund value
    const operationCost = gasPrice.mul((gasLimits[RelayerJobType.TORNADO_WITHDRAW]));

    const serviceFee = parseUnits(amount, decimals)
      .mul(`${tornadoServiceFee * 1e10}`)
      .div(`${100 * 1e10}`);

    let desiredFee = operationCost.add(serviceFee);

    if (!configService.isLightMode && currency !== 'eth') {
      const ethPrice = await this.priceService.getPrice(currency);
      const numerator = BigNumber.from(10).pow(decimals);
      desiredFee = operationCost
        .add(refund)
        .mul(numerator)
        .div(ethPrice)
        .add(serviceFee);
    }
    console.log(
      {
        sentFee: formatEther(fee),
        desiredFee: formatEther(desiredFee),
        serviceFee: formatEther(serviceFee),
      },
    );
    if (fee.lt(desiredFee)) {
      throw new Error('Provided fee is not enough. Probably it is a Gas Price spike, try to resubmit.');
    }
  }

  async getGasPrice(): Promise<BigNumber> {
    // TODO eip https://eips.ethereum.org/EIPS/eip-1559
    const { baseFeePerGas = 0 } = await this.provider.getBlock('latest');
    if (baseFeePerGas) return await this.provider.getGasPrice();
    const { fast = 0 } = await this.oracle.gasPrices();
    return parseUnits(String(fast), 'gwei');
  }
}

export default () => new TxService();
