import { FastifyInstance } from 'fastify';
import { statusSchema, withdrawBodySchema } from './schema';
import { FromSchema } from 'json-schema-to-ts';
import { rewardAccount, tornadoServiceFee } from '../config';
import { version } from '../../package.json';
import { configService } from '../services';

export function mainHandler(server: FastifyInstance, options, next) {
  server.get('/',
    async (req, res) => {
      res.send('hello fellows');
    });

  server.get('/status',
    { schema: statusSchema },
    async (req, res) => {
      server.log.info(req.method, 'status');
      res.send({
        rewardAccount,
        instances: configService.instances,
        netId: configService.netId,
        ethPrices: {
          dai: '488750716084282',
          cdai: '10750196909100',
          usdc: '488744421966526',
          usdt: '486409579105158',
          wbtc: '14586361452511510343',
          torn: '18624781058055820',
        },
        tornadoServiceFee,
        miningServiceFee: 0,
        version,
        health: {
          status: true,
          error: '',
        },
        currentQueue: 0,
      });
    });
  next();
}

export function relayerHandler(server: FastifyInstance, options, next) {
  server.get('/jobs/:id',
    async (req, res) => {
      res.send({});
    });
  server.post<{ Body: FromSchema<typeof withdrawBodySchema> }>('/tornadoWithdraw',
    async (req, res) => {
      console.log(req.body);
      res.send({});
    });
  next();
}
