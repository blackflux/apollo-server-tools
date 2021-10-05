const { makeExecutableSchema } = require('@graphql-tools/schema');
const fs = require('smart-fs');
const path = require('path');

module.exports.loadSchema = () => makeExecutableSchema({
  typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n'),
  parseOptions: {
    commentDescriptions: true
  }
});
