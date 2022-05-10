import createServer from './server';
import { utils } from 'ethers';
import { port, rewardAccount } from '../config';
import { version } from '../../package.json';


if (!utils.isAddress(rewardAccount)) {
  throw new Error('No REWARD_ACCOUNT specified');
}
const server = createServer();

server.listen(port, '0.0.0.0', (err, address) => {
  if (err) throw err;
  console.log(`Relayer ${version} started on port ${address}`);
});
