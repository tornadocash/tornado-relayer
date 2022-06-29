import 'reflect-metadata';
import { configService, getHealthService } from './services';

(async () => {
  try {
    await configService.init();
    const healthService = getHealthService();
    console.log(healthService);
  } catch (e) {
    console.error('Top level catch', e);
  }
})();
