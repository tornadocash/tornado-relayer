import { getPriceService } from '../services';
import { PriceProcessor } from './index';

export const priceProcessor: PriceProcessor = async (job) => {
  const priceService = getPriceService();
  const result = await priceService.fetchPrices(job.data);
  console.log('priceProcessor', result);
  return await priceService.savePrices(result);
};
