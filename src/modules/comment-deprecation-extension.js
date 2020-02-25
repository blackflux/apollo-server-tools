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
    this.sunsetDate = undefined;
    this.isDeprecated = false;
    this.isSunset = false;
  }

  executionDidStart({ executionArgs }) {
    assert(this.deprecationDate === undefined);
    this.deprecationDate = getDeprecationDate({
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
    this.isDeprecated = ![null, undefined].includes(this.deprecationDate);
    if (this.isDeprecated) {
      this.sunsetDate = new Date(this.deprecationDate.getTime() + 1000 * 60 * 60 * 24 * this.sunsetInDays);
      this.isSunset = this.sunsetDate < new Date();
    }
  }

  willResolveField() {
    if (this.forceSunset === true && this.isSunset === true) {
      throw new GraphQLError(
        `Functionality has been sunset as of "${this.sunsetDate.toUTCString()}".`,
        undefined, undefined, undefined, undefined, undefined,
        { code: 'DEPRECATION_ERROR' }
      );
    }
  }

  willSendResponse(kwargs) {
    const { graphqlResponse } = kwargs;
    if (this.isDeprecated) {
      const headers = Object.fromEntries(graphqlResponse.http.headers.entries());
      updateDeprecationHeaders(headers, {
        deprecationDate: this.deprecationDate,
        sunsetDate: this.sunsetDate
      });
      Object.entries(headers)
        .forEach(([k, v]) => graphqlResponse.http.headers.set(k, v));
    }
    return kwargs;
  }
}

module.exports = CommentDeprecationExtension;
