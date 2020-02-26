const { GraphQLExtension } = require('graphql-extensions');
const { ApolloError } = require('apollo-server-errors');
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
    this.deprecatedMeta = {};
  }

  requestDidStart({ request }) {
    this.version = request.headers.get(this.apiVersionHeader);
  }

  executionDidStart({ executionArgs }) {
    this.deprecatedMeta = getDeprecationMeta({
      version: this.version,
      versions: this.versions,
      sunsetDurationInDays: this.sunsetDurationInDays,
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
  }

  // can not throw in executionDidStart(), so doing it here
  willResolveField() {
    if (!VERSION_REGEX.test(String(this.version))) {
      throw new ApolloError(
        `Missing or invalid api version header "${this.apiVersionHeader}".`,
        'VERSION_HEADER_INVALID'
      );
    }
    if (this.versions[this.version] === undefined) {
      throw new ApolloError(
        `Unknown api version "${this.version}" provided for header "${this.apiVersionHeader}".`,
        'VERSION_HEADER_INVALID'
      );
    }
    const {
      isDeprecated,
      sunsetDate,
      isSunset,
      minVersionAccessed
    } = this.deprecatedMeta;
    if (isDeprecated === true && pv.test(`${minVersionAccessed} <= ${this.version}`)) {
      throw new ApolloError(
        `Functionality unsupported for version "${this.version}".`,
        'DEPRECATION_ERROR'
      );
    }
    if (this.forceSunset === true && isSunset === true) {
      throw new ApolloError(
        `Functionality sunset since "${sunsetDate.toUTCString()}".`,
        'DEPRECATION_ERROR'
      );
    }
  }

  willSendResponse(kwargs) {
    const { graphqlResponse } = kwargs;
    const { isDeprecated, deprecationDate, sunsetDate } = this.deprecatedMeta;
    if (isDeprecated === true) {
      const headers = Object.fromEntries(graphqlResponse.http.headers.entries());
      pv.updateDeprecationHeaders(headers, { deprecationDate, sunsetDate });
      Object.entries(headers)
        .forEach(([k, v]) => graphqlResponse.http.headers.set(k, v));
    }
    return kwargs;
  }
}

module.exports = CommentDeprecationExtension;
