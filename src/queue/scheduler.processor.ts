import { configService } from '../services';
import { Processor } from 'bullmq';

export const checkBalance: Processor = async (job) => {
  return await configService.getBalance();
};
