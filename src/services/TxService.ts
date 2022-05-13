import { TxManager } from 'tx-manager';
import { configService } from './index';
import { ProxyLightABI, TornadoProxyABI } from '../../contracts';
import { parseEther } from 'ethers/lib/utils';
import { gasLimits } from '../config';

export class TxService {
  txManager: TxManager;
  tornadoProxy: TornadoProxyABI | ProxyLightABI;

  constructor() {
    const { privateKey, rpcUrl, proxyContract } = configService;
    this.txManager = new TxManager({ privateKey, rpcUrl });
    this.tornadoProxy = proxyContract;
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

    console.log(receipt);
    await Promise.resolve();
  }

  private async prepareCallData(data) {
    // const calldata = this.tornadoProxy.interface.encodeFunctionData('withdraw', );

    return {
      value: data.args[5],
      to: this.tornadoProxy.address,
      data: [],
      gasLimit: gasLimits['WITHDRAW_WITH_EXTRA'],
    };
  }
}


export default new TxService();
