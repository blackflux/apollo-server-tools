const get = require('lodash.get');
const {
  getNamedType,
  TypeInfo,
  visit,
  visitWithTypeInfo
} = require('graphql');
const parseInfo = require('./parse-info');

const isDeprecated = (fd) => fd && fd.description && fd.description.startsWith('[deprecated] ');

const getDeprecationDetails = (schema, ast) => {
  const { args } = parseInfo(ast);
  const typeMap = schema.getTypeMap();
  const typeInfo = new TypeInfo(schema);

  const result = new Set();

  visit(ast, visitWithTypeInfo(typeInfo, {
    enter(node, key, parent) {
      const fieldDef = typeInfo.getFieldDef();
      // deprecate regular fieldDefs
      if (isDeprecated(fieldDef)) {
        result.add(fieldDef);
      }
      // deprecate used arguments
      if (fieldDef && Array.isArray(fieldDef.args)) {
        fieldDef.args
          .filter((arg) => isDeprecated(arg))
          .filter((arg) => get(args, [get(parent, 'name.value'), arg.name]) !== undefined)
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

module.exports.getDeprecationDate = (schema, ast, offsetInDays = 0) => {
  let result = null;
  getDeprecationDetails(schema, ast)
    .forEach((d) => {
      const date = new Date(d.description.split(' ', 2)[1]);
      // compute earliest deprecation date
      if (result === null || date < result) {
        result = date;
      }
    });
  if (result === null) {
    return null;
  }
  result.setTime(result.getTime() + offsetInDays * 86400000);
  return result.toUTCString();
};
