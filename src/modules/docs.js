const fs = require('smart-fs');
const get = require('lodash.get');
const objectScan = require('object-scan');
const stringify = require('json-stable-stringify');
const { graphqlSync } = require('graphql');
const { introspectionQuery } = require('graphql/utilities');
const { isDeprecated } = require('./deprecation');

const removeDeprecated = (docsContent) => objectScan(['**.{fields,args,types}[*]'], {
  filterFn: (k, v) => isDeprecated(v),
  joined: false
})(docsContent)
  .forEach((k) => get(docsContent, k.slice(0, -1)).splice(k.slice(-1)[0], 1));

const generateDocs = (schema, stripDeprecated = true) => {
  const result = JSON.parse(JSON.stringify(graphqlSync(schema, introspectionQuery)));
  if (stripDeprecated === true) {
    removeDeprecated(result);
  }
  return result;
};
module.exports.generateDocs = generateDocs;

const syncDocs = (filePath, schema, stripDeprecated = true) => {
  const result = generateDocs(schema, stripDeprecated);
  const resultStr = stringify(result).split('\n');
  return fs.smartWrite(filePath, resultStr, { treatAs: 'txt' });
};
module.exports.syncDocs = syncDocs;
