import { getPriceService } from '../services';
import { PriceProcessor } from './index';

export const priceProcessor: PriceProcessor = async (job) => {
  const priceService = getPriceService();
  const result = await priceService.fetchPrices(job.data);
  if (result) return await priceService.savePrices(result);
  return null;
};

