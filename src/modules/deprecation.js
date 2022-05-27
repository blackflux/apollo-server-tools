import assert from 'assert';
import get from 'lodash.get';
import { getNamedType } from 'graphql';
import pv from 'painless-version';
import { DEPRECATED_REGEX } from '../resources/regex.js';
import astTraverse from '../util/ast-traverse.js';

export const isDeprecated = (fd) => fd && DEPRECATED_REGEX.test(fd.description);

export const getDeprecationDetails = ({
  schema, ast, fragments = {}, vars = {}
}) => {
  const result = new Set();

  astTraverse({
    schema,
    ast,
    fragments,
    vars,
    onEnter: ({
      typeInfo,
      ancestors,
      args,
      typeMap,
      fieldDef
    }) => {
      // deprecate regular fieldDefs
      if (isDeprecated(fieldDef)) {
        result.add(fieldDef);
      }
      // deprecate used arguments
      if (fieldDef && Array.isArray(fieldDef.args)) {
        fieldDef.args
          .filter((arg) => isDeprecated(arg))
          .filter((arg) => get(args, [
            ...ancestors
              .filter((a) => a.kind === 'Field')
              .map((a) => get(a, 'name.value')),
            arg.name
          ]) !== undefined)
          .forEach((arg) => result.add(arg));
      }
      // deprecate result types
      [typeInfo.getType(), typeInfo.getInputType()]
        .filter((t) => !!t)
        .map((t) => typeMap[getNamedType(t)])
        .filter((t) => isDeprecated(t))
        .forEach((t) => result.add(t));
    }
  });

  return [...result];
};

export const getDeprecationMeta = ({
  versions,
  sunsetDurationInDays,
  schema,
  ast,
  fragments = {},
  vars = {}
}) => {
  const result = {
    isDeprecated: false,
    deprecationDate: null,
    sunsetDate: null,
    isSunset: false,
    minVersionAccessed: null
  };
  getDeprecationDetails({
    schema, ast, fragments, vars
  })
    .forEach((d) => {
      const version = d.description.split(' ', 2)[1];
      const deprecationDate = versions[version];
      assert(deprecationDate !== undefined, `Unknown version specified "${version}"`);
      assert(deprecationDate instanceof Date, `Invalid version format specified "${version}"`);
      if (result.deprecationDate === null || deprecationDate < result.deprecationDate) {
        result.isDeprecated = true;
        result.deprecationDate = deprecationDate;
        result.sunsetDate = new Date(deprecationDate.getTime() + 1000 * 60 * 60 * 24 * sunsetDurationInDays);
        result.isSunset = result.sunsetDate < new Date();
      }
      if (result.minVersionAccessed === null || pv.test(`${version} < ${result.minVersionAccessed}`)) {
        result.minVersionAccessed = version;
      }
    });
  return result;
};
