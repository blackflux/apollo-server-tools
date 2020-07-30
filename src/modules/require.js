const get = require('lodash.get');
const {
  TypeInfo,
  visit,
  visitWithTypeInfo
} = require('graphql');
const pv = require('painless-version');
const parseInfo = require('./parse-info');
const { REQUIRED_REGEX } = require('../resources/regex');

const isRequired = (fd) => fd && REQUIRED_REGEX.test(fd.description);
module.exports.isRequired = isRequired;

const getRequireDetails = ({
  schema, ast, fragments = {}, vars = {}
}) => {
  const { args } = parseInfo({ ast, fragments, vars });
  const typeInfo = new TypeInfo(schema);

  const required = new Set();
  const provided = new Set();

  visit(ast, visitWithTypeInfo(typeInfo, {
    enter(node, key, parent, path, ancestors) {
      const fieldDef = typeInfo.getFieldDef();
      if (fieldDef && Array.isArray(fieldDef.args)) {
        const argsReq = fieldDef.args
          .filter((arg) => isRequired(arg));
        argsReq
          .forEach((arg) => required.add(arg));
        argsReq
          .filter((arg) => get(args, [
            ...ancestors
              .filter((a) => a.kind === 'Field')
              .map((a) => get(a, 'name.value')),
            arg.name
          ]) !== undefined)
          .forEach((arg) => provided.add(arg));
      }
    }
  }));

  return [...required].filter((e) => !provided.has(e));
};
module.exports.getRequireDetails = getRequireDetails;

const getRequireMeta = ({
  schema,
  ast,
  fragments = {},
  vars = {}
}) => {
  const result = {
    isRequiredMissing: false,
    minVersionAccessed: null
  };
  getRequireDetails({
    schema, ast, fragments, vars
  })
    .forEach((d) => {
      const version = d.description.split(' ', 2)[1];
      if (result.minVersionAccessed === null || pv.test(`${version} < ${result.minVersionAccessed}`)) {
        result.isRequiredMissing = true;
        result.minVersionAccessed = version;
      }
    });
  return result;
};
module.exports.getRequireMeta = getRequireMeta;
