import Joi from 'joi-strict';
import objectScan from 'object-scan';
import { ApolloError } from 'apollo-server-errors';
import parseInfo from './parse-info.js';

export default (cb) => {
  Joi.assert(cb, Joi.function());
  const scanner = objectScan(['**'], {
    filterFn: ({ isLeaf, key, value }) => {
      if (isLeaf) {
        return !cb({
          path: key.join('.'),
          name: key[key.length - 1],
          value
        });
      }
      return false;
    },
    rtn: 'parent',
    abort: true
  });

  return {
    requestDidStart() {
      return {
        executionDidStart({ document, request }) {
          const { args } = parseInfo({ ast: document, vars: request.variables });
          const error = scanner(args);
          if (error) {
            throw new ApolloError(
              'Invalid Argument Provided.',
              'BAD_USER_INPUT'
            );
          }
        }
      };
    }
  };
};
