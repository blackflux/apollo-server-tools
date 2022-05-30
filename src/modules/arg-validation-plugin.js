import Joi from 'joi-strict';
import objectScan from 'object-scan';
import { ApolloError } from 'apollo-server-errors';
import parseInfo from './parse-info.js';

export default (cb) => {
  Joi.assert(cb, Joi.function());
  const scanner = objectScan(['**'], {
    filterFn: ({
      isLeaf, key, value, context
    }) => {
      if (isLeaf) {
        const kwargs = {
          path: key.join('.'),
          name: key[key.length - 1],
          value
        };
        const message = cb(kwargs);
        if (message !== true) {
          Object.assign(context, { ...kwargs, message });
          return true;
        }
      }
      return false;
    },
    rtn: 'bool',
    abort: true
  });

  return {
    requestDidStart() {
      return {
        executionDidStart({ document, request }) {
          const { args } = parseInfo({ ast: document, vars: request.variables });
          const ctx = {};
          const error = scanner(args, ctx);
          if (error) {
            const isString = typeof ctx.value === 'string';
            const sep = isString ? '"' : '';
            throw new ApolloError(
              `Invalid value provided for Argument "${ctx.name}", found ${sep}${ctx.value}${sep}; ${ctx.message}`,
              'BAD_USER_INPUT'
            );
          }
        }
      };
    }
  };
};
