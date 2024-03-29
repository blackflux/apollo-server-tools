import set from 'lodash.set';
import { valueFromASTUntyped } from 'graphql';

const extractNested = (selection, path, ctx) => {
  switch (selection.kind) {
    case 'Document':
      return selection.definitions.filter((d) => d.kind !== 'FragmentDefinition')
        .reduce((p, c) => p.concat(extractNested(c, path, {
          ...ctx,
          fragments: selection.definitions
            .filter((d) => d.kind === 'FragmentDefinition')
            .reduce((frags, frag) => Object.assign(frags, { [frag.name.value]: frag }), {})
        })), []);
    case undefined:
      return selection.fieldNodes.reduce((p, c) => p
        .concat(extractNested(c, path, {
          ...ctx,
          fragments: selection.fragments,
          vars: selection.variableValues
        })), []);
    case 'OperationDefinition':
      return extractNested(selection.selectionSet, path, ctx);
    case 'Field':
      if (selection.arguments !== undefined) {
        selection.arguments
          .map((arg) => [
            path.concat(selection.name.value, arg.name.value),
            arg.value.kind === 'Variable' ? ctx.vars[arg.value.name.value] : valueFromASTUntyped(arg.value)
          ])
          .filter(([_, value]) => value !== null)
          .forEach(([p, value]) => set(ctx.args, p, value));
      }
      if (selection.selectionSet === undefined) {
        return selection.name.value !== '__typename' ? [path.concat(selection.name.value)] : [];
      }
      return extractNested(selection.selectionSet, path.concat(selection.name.value), ctx);
    case 'FragmentSpread':
      return extractNested(ctx.fragments[selection.name.value].selectionSet, path, ctx);
    case 'SelectionSet':
      return selection.selections.reduce((p, c) => p
        .concat(extractNested(c, path, ctx)), []);
    case 'InlineFragment':
      return extractNested(selection.selectionSet, path, ctx);
    default:
      throw new Error(`Unexpected Kind: ${selection.kind}`);
  }
};

export default ({ ast, fragments = {}, vars = {} }) => {
  const argsGrouped = {};
  const fieldsGrouped = extractNested(ast, [], { args: argsGrouped, fragments, vars })
    .reduce((p, c) => Object.assign(p, { [c[0]]: (p[c[0]] || []).concat(c.slice(1).join('.')) }), {});
  const args = ast.kind === 'Document' ? argsGrouped : (Object.values(argsGrouped)[0] || {});
  const fields = ast.kind === 'Document' ? fieldsGrouped : Object.values(fieldsGrouped)[0];
  return { args, fields, ops: Object.keys(fieldsGrouped) };
};
