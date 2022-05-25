const Joi = require('joi-strict');
const objectScan = require('object-scan');
const { ApolloError } = require('apollo-server-errors');

module.exports = (opts) => {
  Joi.assert(opts, Joi.object().keys({}));

  return {
    requestDidStart() {
      return {
        executionDidStart({ document }) {
          const error = objectScan(['**'], {
            filterFn: ({ value }) => value === '',
            breakFn: ({ isCircular }) => isCircular === true,
            rtn: 'bool',
            abort: true
          })(document);
          if (error) {
            throw new ApolloError(
              'Empty String Provided.',
              'GRAPHQL_PARSE_FAILED'
            );
          }
        },
        willSendResponse({ response }) {}
      };
    }
  };
};
