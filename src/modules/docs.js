import fs from 'smart-fs';
import get from 'lodash.get';
import objectScan from 'object-scan';
import stringify from 'json-stable-stringify';
import { graphqlSync, getIntrospectionQuery } from 'graphql';
import { isDeprecated } from './deprecation.js';

const removeDeprecated = (docsContent) => objectScan(['**.{fields,args,types}[*]'], {
  filterFn: ({ value }) => isDeprecated(value)
})(docsContent)
  .forEach((k) => get(docsContent, k.slice(0, -1)).splice(k.slice(-1)[0], 1));

export const generateDocs = (schema, stripDeprecated = true) => {
  const result = JSON.parse(JSON.stringify(graphqlSync(schema, getIntrospectionQuery())));
  if (stripDeprecated === true) {
    removeDeprecated(result);
  }
  return result;
};

export const syncDocs = (filePath, schema, stripDeprecated = true) => {
  const result = generateDocs(schema, stripDeprecated);
  const resultStr = stringify(result, { space: '  ' }).split('\n');
  return fs.smartWrite(filePath, resultStr, { treatAs: 'txt' });
};
