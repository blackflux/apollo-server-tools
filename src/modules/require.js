import get from 'lodash.get';
import pv from 'painless-version';
import astTraverse from '../util/ast-traverse.js';
import { REQUIRED_REGEX } from '../resources/regex.js';

export const isRequired = (fd) => fd && REQUIRED_REGEX.test(fd.description);

export const getRequireDetails = ({
  schema, ast, fragments = {}, vars = {}
}) => {
  const required = new Set();
  const provided = new Set();

  astTraverse({
    schema,
    ast,
    fragments,
    vars,
    onEnter: ({
      ancestors,
      args,
      fieldDef
    }) => {
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
  });

  return [...required].filter((e) => !provided.has(e));
};

export const getRequireMeta = ({
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
