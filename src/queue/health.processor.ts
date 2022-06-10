import { getHealthService } from '../services';
import { Processor } from 'bullmq';

export const healthProcessor: Processor = async () => {
  const healthService = getHealthService();

  try {
    await healthService.check();
    await healthService.setStatus({ status: true, error: '' });
  } catch (e) {
    await healthService.saveError(e);
    await healthService.setStatus({ status: false, error: e.message });
  }
};

