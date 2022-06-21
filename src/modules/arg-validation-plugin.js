import Joi from 'joi-strict';
import objectScan from 'object-scan';
import parseInfo from './parse-info.js';
import throwError from '../util/throw-error.js';

export default (opts) => {
  Joi.assert(opts, Joi.object().keys({
    callback: Joi.function(),
    onError: Joi.function().optional()
  }));
  const callback = opts.callback;
  const onError = opts.onError || (() => {});
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
        const message = callback(kwargs);
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
        executionDidStart(context) {
          const { document, request } = context;
          const { args } = parseInfo({ ast: document, vars: request.variables });
          const ctx = {};
          const error = scanner(args, ctx);
          if (error) {
            const isString = typeof ctx.value === 'string';
            const sep = isString ? '"' : '';
            throwError(
              'BAD_USER_INPUT',
              `Invalid value provided for Argument "${ctx.name}", found ${sep}${ctx.value}${sep}; ${ctx.message}`,
              onError,
              context
            );
          }
        }
      };
    }
  };
};
