import { configService, getPriceService } from '../services';
import { Processor } from 'bullmq';

export const schedulerProcessor: Processor = async (job) => {
  switch (job.name) {
  case 'updatePrices': {
    const result = await getPriceService().fetchPrices(job.data);
    return result;
  }
  case 'checkBalance': {
    console.log(job.data);
    return await configService.getBalance();
  }
  }
};
