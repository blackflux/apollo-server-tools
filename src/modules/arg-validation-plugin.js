const Joi = require('joi-strict');
const objectScan = require('object-scan');
const { ApolloError } = require('apollo-server-errors');

module.exports = (opts) => {
  Joi.assert(opts, Joi.object().keys({
    reject: Joi.array().items(Joi.string().allow(''))
  }));
  const { reject } = opts;
  const scanner = objectScan([
    'definitions.**(^selectionSet$|^selections$).arguments.value.value'
  ], {
    useArraySelector: false,
    filterFn: ({ value }) => reject.includes(value),
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
              'GRAPHQL_PARSE_FAILED'
            );
          }
        }
      };
    }
  };
};
