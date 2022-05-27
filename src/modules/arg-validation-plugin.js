import Joi from 'joi-strict';
import objectScan from 'object-scan';
import { ApolloError } from 'apollo-server-errors';

export default (opts) => {
  Joi.assert(opts, Joi.object().keys({
    reject: Joi.array().items(Joi.string().allow(''))
  }));
  const { reject } = opts;
  const scanner = objectScan([
    'definitions.**(^selectionSet$|^selections$).arguments.value.value'
  ], {
    useArraySelector: false,
    filterFn: ({ value }) => typeof value === 'string' && reject.includes(value.trim()),
    breakFn: ({ isCircular }) => isCircular === true,
    rtn: 'parent',
    abort: true
  });

  return {
    requestDidStart() {
      return {
        executionDidStart({ document }) {
          const error = scanner(document);
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
