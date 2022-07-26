import { getHealthService } from '../services';
import { HealthProcessor } from './index';

export const healthProcessor: HealthProcessor = async (job) => {
  const healthService = getHealthService();
  try {
    switch (job.name) {
      case 'checkHealth': {
        const status = await healthService.check();
        await healthService.clearErrorCodes();
        await healthService.setStatus({ status: true, error: '' });
        return status;
      }
      case 'checkUpdate': {
        const status = await healthService.checkUpdate();
        return status;
      }
    }
  } catch (e) {
    await healthService.saveError(e);
    await healthService.setStatus({ status: false, error: e.message });
    return { error: e.message };
  }
};
