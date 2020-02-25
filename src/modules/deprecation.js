const assert = require('assert');
const get = require('lodash.get');
const {
  getNamedType,
  TypeInfo,
  visit,
  visitWithTypeInfo
} = require('graphql');
const parseInfo = require('./parse-info');
const { DEPRECATED_REGEX } = require('../resources/regex');

const isDeprecated = (fd) => fd && DEPRECATED_REGEX.test(fd.description);
module.exports.isDeprecated = isDeprecated;

const getDeprecationDetails = ({
  schema, ast, fragments = {}, vars = {}
}) => {
  const { args } = parseInfo({ ast, fragments, vars });
  const typeMap = schema.getTypeMap();
  const typeInfo = new TypeInfo(schema);

  const result = new Set();

  visit(ast, visitWithTypeInfo(typeInfo, {
    enter(node, key, parent, path, ancestors) {
      const fieldDef = typeInfo.getFieldDef();
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
  }));

  return [...result];
};
module.exports.getDeprecationDetails = getDeprecationDetails;

const getDeprecationDate = ({
  versions, schema, ast, fragments = {}, vars = {}
}) => {
  let result = null;
  getDeprecationDetails({
    schema, ast, fragments, vars
  })
    .forEach((d) => {
      const version = d.description.split(' ', 2)[1];
      const date = versions[version];
      assert(date !== undefined, `Unknown version specified "${version}"`);
      assert(date instanceof Date, `Invalid version format specified "${version}"`);
      // compute earliest deprecation date
      if (result === null || date < result) {
        result = date;
      }
    });
  return result === null ? null : new Date(result);
};
module.exports.getDeprecationDate = getDeprecationDate;
