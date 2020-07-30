const {
  TypeInfo,
  visit,
  visitWithTypeInfo
} = require('graphql');
const parseInfo = require('../modules/parse-info');

module.exports = ({
  schema,
  ast,
  fragments,
  vars,
  onEnter
}) => {
  const { args } = parseInfo({ ast, fragments, vars });
  const typeMap = schema.getTypeMap();
  const typeInfo = new TypeInfo(schema);

  visit(ast, visitWithTypeInfo(typeInfo, {
    enter(node, key, parent, path, ancestors) {
      const fieldDef = typeInfo.getFieldDef();
      onEnter({
        node, key, parent, path, ancestors, fieldDef, typeMap, args, typeInfo
      });
    }
  }));
};
