const assert = require('assert');
const { GraphQLExtension } = require('graphql-extensions');
const { GraphQLError } = require('graphql');
const { updateDeprecationHeaders } = require('painless-version');
const { getDeprecationDate } = require('./deprecation');

class CommentDeprecationExtension extends GraphQLExtension {
  constructor({ sunsetInDays, forceSunset }) {
    super();
    assert(Number.isInteger(sunsetInDays) && sunsetInDays >= 0);
    assert(typeof forceSunset === 'boolean');
    this.sunsetInDays = sunsetInDays;
    this.forceSunset = forceSunset;
    this.deprecationDate = undefined;
  }

  executionDidStart({ executionArgs }) {
    assert(this.deprecationDate === undefined);
    this.deprecationDate = getDeprecationDate({
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
  }

  willSendResponse(kwargs) {
    const { graphqlResponse } = kwargs;
    if (![null, undefined].includes(this.deprecationDate)) {
      const headers = Object.fromEntries(graphqlResponse.http.headers.entries());
      updateDeprecationHeaders(headers, {
        deprecationDate: this.deprecationDate,
        sunsetDurationInDays: this.sunsetInDays,
        onSunsetCb: ({ sunsetDate }) => {
          if (this.forceSunset) {
            throw new GraphQLError(
              `Functionality has been sunset as of "${sunsetDate.toUTCString()}".`,
              undefined, undefined, undefined, undefined, undefined,
              { code: 'DEPRECATION_ERROR' }
            );
          }
        }
      });
      Object.entries(headers)
        .forEach(([k, v]) => graphqlResponse.http.headers.set(k, v));
    }
    return kwargs;
  }
}

module.exports = CommentDeprecationExtension;
