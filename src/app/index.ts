import 'reflect-metadata';
import createServer from './server';
import { utils } from 'ethers';
import { port, rewardAccount } from '../config';
import { version } from '../../package.json';
import { configService, getJobService } from '../services';


if (!utils.isAddress(rewardAccount)) {
  throw new Error('No REWARD_ACCOUNT specified');
}
const server = createServer();
server.listen(port, '0.0.0.0', async (err, address) => {
  if (err) throw err;
  await configService.init();
  await getJobService().setupRepeatableJobs();
  console.log(`Relayer ${version} started on port ${address}`);
});

process
  .on('uncaughtException', (e) => {
    console.log('uncaughtException', e);
    process.exit(1);
  });

