const assert = require('assert');
const { ApolloError } = require('apollo-server-errors');
const Joi = require('joi-strict');
const pv = require('painless-version');
const { getDeprecationMeta } = require('./deprecation');
const { getRequireMeta } = require('./require');
const { VERSION_REGEX } = require('../resources/regex');

module.exports = (opts) => {
  Joi.assert(opts, Joi.object().keys({
    apiVersionHeader: Joi.string(),
    forceSunset: Joi.boolean(),
    sunsetDurationInDays: Joi.number().integer().min(0),
    versions: Joi.object().pattern(
      Joi.string().pattern(VERSION_REGEX),
      Joi.date().iso()
    )
  }));
  const apiVersionHeader = opts.apiVersionHeader.toLowerCase();
  const forceSunset = opts.forceSunset;
  const sunsetDurationInDays = opts.sunsetDurationInDays;
  const versions = Object.fromEntries(Object.entries(opts.versions).map(([k, v]) => [k, new Date(v)]));

  const DeprecatedMeta = (version) => {
    let content = null;
    return {
      init: (schema, document) => {
        assert(content === null);
        content = getDeprecationMeta({
          version,
          versions,
          sunsetDurationInDays,
          schema,
          ast: document
        });
      },
      get: () => (content === null ? {} : content)
    };
  };

  return {
    requestDidStart({ request }) {
      const version = request.http.headers.get(apiVersionHeader);
      const deprecatedMeta = DeprecatedMeta(version);

      return {
        executionDidStart({ schema, document }) {
          if (!VERSION_REGEX.test(String(version))) {
            throw new ApolloError(
              `Missing or invalid api version header "${apiVersionHeader}".`,
              'VERSION_HEADER_INVALID'
            );
          }
          if (versions[version] === undefined) {
            throw new ApolloError(
              `Unknown api version "${version}" provided for header "${apiVersionHeader}".`,
              'VERSION_HEADER_INVALID'
            );
          }
          deprecatedMeta.init(schema, document);
          const dMeta = deprecatedMeta.get();
          if (dMeta.isDeprecated === true && pv.test(`${dMeta.minVersionAccessed} <= ${version}`)) {
            throw new ApolloError(
              `Functionality unsupported for version "${version}".`,
              'DEPRECATION_ERROR'
            );
          }
          if (forceSunset === true && dMeta.isSunset === true) {
            throw new ApolloError(
              `Functionality sunset since "${dMeta.sunsetDate.toUTCString()}".`,
              'DEPRECATION_ERROR'
            );
          }
          const rMeta = getRequireMeta({
            version,
            schema,
            ast: document
          });
          if (rMeta.isRequiredMissing === true && pv.test(`${rMeta.minVersionAccessed} <= ${version}`)) {
            throw new ApolloError(
              `Some Argument(s) required since version "${rMeta.minVersionAccessed}".`,
              'REQUIRED_ERROR'
            );
          }
        },
        willSendResponse({ response }) {
          const {
            isDeprecated,
            deprecationDate,
            sunsetDate
          } = deprecatedMeta.get();
          if (isDeprecated === true) {
            const headers = Object.fromEntries(response.http.headers.entries());
            pv.updateDeprecationHeaders(headers, { deprecationDate, sunsetDate });
            Object.entries(headers)
              .forEach(([k, v]) => response.http.headers.set(k, v));
          }
        }
      };
    }
  };
};
