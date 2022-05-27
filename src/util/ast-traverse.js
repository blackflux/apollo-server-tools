import { TypeInfo, visit, visitWithTypeInfo } from 'graphql';
import parseInfo from '../modules/parse-info.js';

export default ({
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
