import { RelayerProcessor } from './index';

export const relayerProcessor: RelayerProcessor = async (job) => {

  console.log(job.data);
};
