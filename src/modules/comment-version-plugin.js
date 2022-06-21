import assert from 'assert';
import Joi from 'joi-strict';
import pv from 'painless-version';
import { getDeprecationMeta } from './deprecation.js';
import { getRequireMeta } from './require.js';
import { VERSION_REGEX } from '../resources/regex.js';
import throwError from '../util/throw-error.js';

export default (opts) => {
  Joi.assert(opts, Joi.object().keys({
    apiVersionHeader: Joi.string(),
    forceSunset: Joi.boolean(),
    sunsetDurationInDays: Joi.number().integer().min(0),
    versions: Joi.object().pattern(
      Joi.string().pattern(VERSION_REGEX),
      Joi.date().iso()
    ),
    onError: Joi.function().optional()
  }));
  const apiVersionHeader = opts.apiVersionHeader.toLowerCase();
  const forceSunset = opts.forceSunset;
  const sunsetDurationInDays = opts.sunsetDurationInDays;
  const versions = Object.fromEntries(Object.entries(opts.versions).map(([k, v]) => [k, new Date(v)]));
  const onError = opts.onError || (() => {});

  const DeprecatedMeta = (version) => {
    let content = null;
    return {
      init: (schema, document, vars) => {
        assert(content === null);
        content = getDeprecationMeta({
          version,
          versions,
          sunsetDurationInDays,
          schema,
          ast: document,
          vars
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
        executionDidStart(context) {
          const { schema, document } = context;
          if (!VERSION_REGEX.test(String(version))) {
            throwError(
              'VERSION_HEADER_INVALID',
              `Missing or invalid api version header "${apiVersionHeader}".`,
              onError,
              context
            );
          }
          if (versions[version] === undefined) {
            throwError(
              'VERSION_HEADER_INVALID',
              `Unknown api version "${version}" provided for header "${apiVersionHeader}".`,
              onError,
              context
            );
          }
          deprecatedMeta.init(schema, document, request.variables);
          const dMeta = deprecatedMeta.get();
          if (dMeta.isDeprecated === true && pv.test(`${dMeta.minVersionAccessed} <= ${version}`)) {
            throwError(
              'DEPRECATION_ERROR',
              `Functionality unsupported for version "${version}".`,
              onError,
              context
            );
          }
          if (forceSunset === true && dMeta.isSunset === true) {
            throwError(
              'DEPRECATION_ERROR',
              `Functionality sunset since "${dMeta.sunsetDate.toUTCString()}".`,
              onError,
              context
            );
          }
          const rMeta = getRequireMeta({
            version,
            schema,
            ast: document,
            vars: request.variables
          });
          if (rMeta.isRequiredMissing === true && pv.test(`${rMeta.minVersionAccessed} <= ${version}`)) {
            throwError(
              'REQUIRED_ERROR',
              `Some Argument(s) required since version "${rMeta.minVersionAccessed}".`,
              onError,
              context
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
