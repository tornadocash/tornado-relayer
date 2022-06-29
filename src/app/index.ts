import 'reflect-metadata';
import createServer from './server';
import { utils } from 'ethers';
import { port, relayerVersion, rewardAccount } from '../config';
import { configService, getJobService, getNotifierService } from '../services';

if (!utils.isAddress(rewardAccount)) {
  throw new Error('No REWARD_ACCOUNT specified');
}
const server = createServer();
server.listen(port, '0.0.0.0', async (err, address) => {
  if (err) throw err;
  await configService.init();
  await configService.clearRedisState();
  await getJobService().setupRepeatableJobs();
  await getNotifierService().subscribe();

  console.log(`Relayer ${relayerVersion} started on port ${address}`);
});

process.on('uncaughtException', (e) => {
  console.log('uncaughtException', e);
  process.exit(1);
});
