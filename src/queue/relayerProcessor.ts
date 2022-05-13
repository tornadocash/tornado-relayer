import { Job } from 'bullmq';

export const relayerProcessor = async (job: Job) => {
  console.log(job.data);
  return {};
};
