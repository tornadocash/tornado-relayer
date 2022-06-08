import { FastifyInstance } from 'fastify';
import { jobsSchema, statusSchema, withdrawBodySchema, withdrawSchema } from './schema';
import { FromSchema } from 'json-schema-to-ts';
import { rewardAccount, tornadoServiceFee } from '../config';
import { configService, getHealthService, getJobService, getPriceService } from '../services';
import { RelayerJobType } from '../types';


export function mainHandler(server: FastifyInstance, options, next) {
  const jobService = getJobService();
  const priceService = getPriceService();
  const healthService = getHealthService();

  server.get('/',
    async (req, res) => {
      res.type('text/html')
        .send('<h1>This is <a href=https://tornado.cash>tornado.cash</a> Relayer service.' +
          ' Check the <a href=/v1/status>/status</a> for settings</h1>');
    });

  server.get('/status',
    { schema: statusSchema },
    async (req, res) => {
      const ethPrices = await priceService.getPrices();
      const currentQueue = await jobService.getQueueCount();
      const errorsLog = await healthService.getErrors();
      console.log(currentQueue);
      res.send({
        rewardAccount,
        instances: configService.instances,
        netId: configService.netId,
        ethPrices,
        tornadoServiceFee,
        miningServiceFee: 0,
        version: '4.5.0',
        health: {
          status: 'true',
          error: '',
          errorsLog
        },
        currentQueue,
      });
    });
  next();
}

export function relayerHandler(server: FastifyInstance, options, next) {
  const jobService = getJobService();
  server.get<{ Params: { id: string } }>('/jobs/:id',
    { schema: jobsSchema },
    async (req, res) => {
      const job = await jobService.getJob(req.params.id);
      if (!job) return server.httpErrors.notFound();
      res.send({ ...job.data, failedReason: job.failedReason });
    });

  server.post<{ Body: FromSchema<typeof withdrawBodySchema> }>('/tornadoWithdraw',
    { schema: withdrawSchema },
    async (req, res) => {
      console.log(req.body);
      const id = await jobService.postJob(RelayerJobType.TORNADO_WITHDRAW, req.body);
      res.send({ id });
    });
  next();
}
