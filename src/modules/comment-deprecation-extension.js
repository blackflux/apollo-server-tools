const assert = require('assert');
const { GraphQLExtension } = require('graphql-extensions');
const { GraphQLError } = require('graphql');
const Joi = require('joi-strict');
const pv = require('painless-version');
const { getDeprecationMeta } = require('./deprecation');
const { VERSION_REGEX } = require('../resources/regex');

class CommentDeprecationExtension extends GraphQLExtension {
  constructor(opts) {
    super();
    Joi.assert(opts, Joi.object().keys({
      apiVersionHeader: Joi.string(),
      forceSunset: Joi.boolean(),
      sunsetDurationInDays: Joi.number().integer().min(0),
      versions: Joi.object().pattern(
        Joi.string().pattern(VERSION_REGEX),
        Joi.date().iso()
      )
    }));
    this.apiVersionHeader = opts.apiVersionHeader.toLowerCase();
    this.forceSunset = opts.forceSunset;
    this.sunsetDurationInDays = opts.sunsetDurationInDays;
    this.versions = Object.fromEntries(Object.entries(opts.versions).map(([k, v]) => [k, new Date(v)]));

    this.version = undefined;
    this.isDeprecated = false;
    this.deprecationDate = undefined;
    this.sunsetDate = undefined;
    this.isSunset = false;
    this.isUnsupported = false;
  }

  requestDidStart({ request }) {
    this.version = request.headers.get(this.apiVersionHeader);
  }

  executionDidStart({ executionArgs }) {
    assert(this.deprecationDate === undefined);
    const {
      isDeprecated,
      deprecationDate,
      sunsetDate,
      isSunset,
      minVersionAccessed
    } = getDeprecationMeta({
      version: this.version,
      versions: this.versions,
      sunsetDurationInDays: this.sunsetDurationInDays,
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
    this.isDeprecated = isDeprecated;
    this.deprecationDate = deprecationDate;
    this.sunsetDate = sunsetDate;
    this.isSunset = isSunset;
    this.isUnsupported = isDeprecated ? pv.test(`${minVersionAccessed} <= ${this.version}`) : false;
  }

  willResolveField() {
    // can not throw in executionDidStart(), so doing it here
    if (this.isUnsupported) {
      throw new GraphQLError(
        `Functionality unsupported for version "${this.version}".`,
        undefined, undefined, undefined, undefined, undefined,
        { code: 'DEPRECATION_ERROR' }
      );
    }
    if (this.forceSunset === true && this.isSunset === true) {
      throw new GraphQLError(
        `Functionality sunset since "${this.sunsetDate.toUTCString()}".`,
        undefined, undefined, undefined, undefined, undefined,
        { code: 'DEPRECATION_ERROR' }
      );
    }
  }

  willSendResponse(kwargs) {
    const { graphqlResponse } = kwargs;
    if (this.isDeprecated) {
      const headers = Object.fromEntries(graphqlResponse.http.headers.entries());
      pv.updateDeprecationHeaders(headers, {
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
