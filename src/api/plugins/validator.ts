import Ajv from 'ajv';
import fp from 'fastify-plugin';
import { rewardAccount } from '../../config';
import { getAddress, isAddress } from 'ethers/lib/utils';

export default fp(async server => {
  const ajv = new Ajv();

  ajv.addKeyword('isAddress', {
    validate: (schema, data) => {
      try {
        return isAddress(data);
      } catch (e) {
        return false;
      }
    },
    errors: true,
  });

  // ajv.addKeyword('isKnownContract', {
  //   validate: (schema, data) => {
  //     try {
  //       return !!getInstance(data);
  //     } catch (e) {
  //       return false;
  //     }
  //   },
  //   errors: true,
  // });

  ajv.addKeyword('isFeeRecipient', {
    validate: (schema, data) => {
      try {
        return getAddress(rewardAccount) === getAddress(data);
      } catch (e) {
        return false;
      }
    },
    errors: true,
  });

  server.setValidatorCompiler(({ schema, method, url, httpPart }) => {
    return ajv.compile(schema);
  });
  console.log('validator plugin registered');
  return Promise.resolve();
});
