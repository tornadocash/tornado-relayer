import { FastifyInstance } from 'fastify';
import { statusSchema, withdrawBodySchema, withdrawSchema } from './schema';
import { FromSchema } from 'json-schema-to-ts';

export function relayerHandler(server: FastifyInstance, options, next) {
  /*
 write some code here, please
  */
  server.get('/',
    async (req, res) => {
      res.send({});
    });
  server.get('/status',
    { schema: statusSchema },
    async (req, res) => {
      res.send({ status: 'status' });
    });
  server.post<{ Body: FromSchema<typeof withdrawBodySchema> }>('/relay',
    { schema: withdrawSchema },
    async (req, res) => {
      res.send({});
    },
  );

  server.get('/jobs/:id',
    async (req, res) => {
      res.send({});
    });
  server.post('/tornadoWithdraw',
    async (req, res) => {
      res.send({});
    });
  next();
}
