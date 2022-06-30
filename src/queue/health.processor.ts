import { getHealthService } from '../services';
import { Processor } from 'bullmq';

export const healthProcessor: Processor = async () => {
  const healthService = getHealthService();
  try {
    const status = await healthService.check();
    await healthService.clearErrorCodes();
    await healthService.setStatus({ status: true, error: '' });
    return status;
  } catch (e) {
    await healthService.saveError(e);
    await healthService.setStatus({ status: false, error: e.message });
    return { error: e.message };
  }
};
