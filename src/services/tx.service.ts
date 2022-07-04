import { TransactionData, TxManager } from 'tx-manager';
import { GasPriceOracle } from 'gas-price-oracle';
import { Provider } from '@ethersproject/providers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { ProxyLightABI, TornadoProxyABI } from '../contracts';
import { BASE_FEE_RESERVE_PERCENTAGE, CONFIRMATIONS, gasLimits, MAX_GAS_PRICE, tornadoServiceFee } from '../config';
import { JobStatus, RelayerJobType } from '../types';
import { PriceService } from './price.service';
import { Job } from 'bullmq';
import { RelayerJobData } from '../queue';
import { ConfigService } from './config.service';
import { container, injectable } from 'tsyringe';
import { parseJSON } from '../modules/utils';

export type WithdrawalData = {
  contract: string;
  proof: BytesLike;
  args: [BytesLike, BytesLike, string, string, BigNumberish, BigNumberish];
};

class ExecutionError extends Error {
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }

  code: string;
}

@injectable()
export class TxService {
  set currentJob(value: Job) {
    this._currentJob = value;
  }

  txManager: TxManager;
  tornadoProxy: TornadoProxyABI | ProxyLightABI;
  oracle: GasPriceOracle;
  provider: Provider;
  private _currentJob: Job;

  constructor(private config: ConfigService, private priceService: PriceService) {
    const { privateKey, rpcUrl, netId } = this.config;
    this.tornadoProxy = this.config.proxyContract;
    this.provider = this.tornadoProxy.provider;
    this.txManager = new TxManager({
      privateKey,
      rpcUrl,
      config: { THROW_ON_REVERT: true, CONFIRMATIONS, MAX_GAS_PRICE, BASE_FEE_RESERVE_PERCENTAGE },
      provider: this.provider,
    });
    this.oracle = new GasPriceOracle({
      defaultRpc: rpcUrl,
      chainId: netId,
      fallbackGasPrices: this.config?.fallbackGasPrices,
    });
  }

  async updateJobData(data: Partial<RelayerJobData>) {
    const updatedData = { ...this._currentJob.data, ...data };
    console.log({ updatedData });
    await this._currentJob.update(updatedData);
  }

  async sendTx(tx: TransactionData) {
    try {
      const currentTx = this.txManager.createTx(tx);

      const receipt = await currentTx
        .send()
        .on('transactionHash', async (txHash) => {
          console.log('Transaction sent, txHash: ', txHash);
          await this.updateJobData({ txHash, status: JobStatus.SENT });
        })
        .on('mined', async (receipt) => {
          console.log('Transaction mined in block', receipt.blockNumber);
          await this.updateJobData({ status: JobStatus.MINED });
        })
        .on('confirmations', async (confirmations) => {
          console.log('Transaction confirmations: ', confirmations);
          await this.updateJobData({ confirmations });
        });
      if (receipt.status === 1) {
        await this.updateJobData({ status: JobStatus.CONFIRMED });
      } else throw new ExecutionError('Submitted transaction failed', 'REVERTED');
      return receipt;
    } catch (e) {
      const regex = /body=("\{.*}}")/;
      if (regex.test(e.message)) {
        const { error } = parseJSON(regex.exec(e.message)[1]);
        throw new ExecutionError(error.message, 'REVERTED');
      } else throw new ExecutionError(e.message, 'SEND_ERROR');
    }
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
    const instance = this.config.getInstance(contract);
    if (!instance) throw new Error('Instance not found');
    const { currency, amount, decimals } = instance;
    const [fee, refund] = [args[4], args[5]].map(BigNumber.from);
    const gasPrice = await this.getGasPrice();
    // TODO check refund value
    const operationCost = gasPrice.mul(gasLimits[RelayerJobType.TORNADO_WITHDRAW]);

    const serviceFee = parseUnits(amount, decimals)
      .mul(`${tornadoServiceFee * 1e10}`)
      .div(`${100 * 1e10}`);

    let desiredFee = operationCost.add(serviceFee);

    if (!this.config.isLightMode && currency !== 'eth') {
      const ethPrice = await this.priceService.getPrice(currency);
      const numerator = BigNumber.from(10).pow(decimals);
      desiredFee = operationCost.add(refund).mul(numerator).div(ethPrice).add(serviceFee);
    }
    console.log({
      sentFee: formatEther(fee),
      desiredFee: formatEther(desiredFee),
      serviceFee: formatEther(serviceFee),
    });
    if (fee.lt(desiredFee)) {
      throw new Error('Provided fee is not enough. Probably it is a Gas Price spike, try to resubmit.');
    }
  }

  async getGasPrice(): Promise<BigNumber> {
    const gasPrices = await this.oracle.gasPrices();
    let gasPrice = gasPrices['fast'];
    if ('maxFeePerGas' in gasPrices) gasPrice = gasPrices['maxFeePerGas'];
    return parseUnits(String(gasPrice), 'gwei');
  }
}

export default () => container.resolve(TxService);
