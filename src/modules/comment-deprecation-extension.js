const assert = require('assert');
const { GraphQLExtension } = require('graphql-extensions');
const { GraphQLError } = require('graphql');
const Joi = require('joi-strict');
const { updateDeprecationHeaders } = require('painless-version');
const { getDeprecationDate } = require('./deprecation');
const { VERSION_REGEX } = require('../resources/regex');

class CommentDeprecationExtension extends GraphQLExtension {
  constructor(opts) {
    super();
    Joi.assert(opts, Joi.object().keys({
      forceSunset: Joi.boolean(),
      sunsetDurationInDays: Joi.number().integer().min(0),
      versions: Joi.object().pattern(
        Joi.string().pattern(VERSION_REGEX),
        Joi.date().iso()
      )
    }));
    this.forceSunset = opts.forceSunset;
    this.sunsetDurationInDays = opts.sunsetDurationInDays;
    this.versions = Object.fromEntries(Object.entries(opts.versions).map(([k, v]) => [k, new Date(v)]));

    this.deprecationDate = undefined;
    this.sunsetDate = undefined;
    this.isDeprecated = false;
    this.isSunset = false;
  }

  executionDidStart({ executionArgs }) {
    assert(this.deprecationDate === undefined);
    this.deprecationDate = getDeprecationDate({
      versions: this.versions,
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
    this.isDeprecated = ![null, undefined].includes(this.deprecationDate);
    if (this.isDeprecated) {
      this.sunsetDate = new Date(this.deprecationDate.getTime() + 1000 * 60 * 60 * 24 * this.sunsetDurationInDays);
      this.isSunset = this.sunsetDate < new Date();
    }
  }

  willResolveField() {
    // can not throw in executionDidStart(), so doing it here
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
