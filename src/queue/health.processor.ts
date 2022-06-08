import { getHealthService } from '../services';
import { Processor } from 'bullmq';

export const healthProcessor: Processor = async () => {
    const healthService = getHealthService();
    await healthService.check();
  }
;
