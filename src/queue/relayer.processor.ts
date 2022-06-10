import { RelayerProcessor } from './index';
import { getTxService } from '../services';
import { JobStatus } from '../types';

export const relayerProcessor: RelayerProcessor = async (job) => {
  try {
    await job.update({ ...job.data, status: JobStatus.ACCEPTED });
    console.log(`Start processing a new ${job.data.type} job ${job.id}`);

    const txService = getTxService();
    txService.currentJob = job;
    const withdrawalData = job.data;
    await txService.checkTornadoFee(withdrawalData);
    const txData = await txService.prepareTxData(withdrawalData);
    return await txService.sendTx(txData);
  } catch (e) {
    await job.update({ ...job.data, status: JobStatus.FAILED });
    throw e;
  }
};
