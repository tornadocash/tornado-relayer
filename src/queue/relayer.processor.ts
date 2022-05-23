import { RelayerProcessor } from './index';
import { getTxService } from '../services';
import { JobStatus } from '../types';

export const relayerProcessor: RelayerProcessor = async (job) => {
  await job.update({ ...job.data, status: JobStatus.ACCEPTED });
  console.log(`Start processing a new ${job.data.type} job ${job.id}`);

  const txService = getTxService();
  const withdrawalData = job.data;
  await txService.checkTornadoFee(withdrawalData);
  const txData = await txService.prepareTxData(withdrawalData);
  const receipt = await txService.sendTx(txData);
  console.log(receipt);
  return receipt;
};
