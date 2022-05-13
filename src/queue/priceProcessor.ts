import { priceService } from '../services';
import { Job } from 'bullmq';

export const priceProcessor = async (job: Job) => {
  const prices = await priceService.fetchPrices(job.data);
  console.log(job.name, prices);
  return prices;
};
