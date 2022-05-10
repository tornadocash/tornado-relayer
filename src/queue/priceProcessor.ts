import priceService from '../services/PriceService';
import { Job } from 'bullmq';

export const priceProcessor = async (job: Job) => {
  const { tokens } = job.data;
  const prices = await priceService.getPrices(tokens);
  console.log(prices);
};
