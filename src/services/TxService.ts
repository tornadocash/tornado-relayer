import { TxManager } from 'tx-manager';
import { configService } from './index';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils';
import { gasLimits, httpRpcUrl, tornadoServiceFee } from '../config';
import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { JobType } from '../types';
import getPriceService from './PriceService';
import { GasPriceOracle } from 'gas-price-oracle';

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
  priceService: ReturnType<typeof getPriceService>;
  oracle: GasPriceOracle;

  constructor() {
    const { privateKey, rpcUrl, netId } = configService;
    this.txManager = new TxManager({ privateKey, rpcUrl });
    this.tornadoProxy = configService.proxyContract;
    this.oracle = new GasPriceOracle({ defaultRpc: httpRpcUrl, chainId: netId });
    this.priceService = getPriceService();
  }

  async init() {
    const currentTx = this.txManager.createTx({
      nonce: 123,
      to: '0x2f04c418e91585222a7042FFF4aB7281D34FdfCC',
      value: parseEther('1'),
    });

    const receipt = await currentTx.send()
      .on('transactionHash', txHash => console.log({ txHash }))
      .on('mined', receipt => console.log('Mined in block', receipt.blockNumber))
      .on('confirmations', confirmations => console.log({ confirmations }));

    return receipt;
  }

  private async prepareCallData(data: WithdrawalData) {
    const { contract, proof, args } = data;
    const calldata = this.tornadoProxy.interface.encodeFunctionData('withdraw', [contract, proof, ...args]);
    return {
      value: data.args[5],
      to: this.tornadoProxy.address,
      data: calldata,
      gasLimit: gasLimits['WITHDRAW_WITH_EXTRA'],
    };
  }

  async checkTornadoFee({ args, contract }: WithdrawalData) {
    const { currency, amount, decimals } = configService.getInstance(contract);
    const [fee, refund] = [args[4], args[5]].map(BigNumber.from);
    const gasPrice = await this.getGasPrice();
    const ethPrice = await this.priceService.getPrice(currency);
    const operationCost = gasPrice.mul((gasLimits[JobType.TORNADO_WITHDRAW]));

    const serviceFee = parseUnits(amount, decimals)
      .mul(tornadoServiceFee * 1e10)
      .div(100 * 1e10);

    let desiredFee = operationCost.add(serviceFee);
    if (currency !== 'eth') {
      desiredFee = operationCost
        .add(refund)
        .mul(10 ** decimals)
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
    const { baseFeePerGas = 0 } = await this.tornadoProxy.provider.getBlock('latest');
    // const gasPrice = await this.tornadoProxy.provider.getGasPrice();
    if (baseFeePerGas) return baseFeePerGas;
    const { fast = 0 } = await this.oracle.gasPrices();
    return parseUnits(String(fast), 'gwei');
  }

}

export default () => new TxService();
