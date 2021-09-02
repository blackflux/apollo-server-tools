const { ApolloServer } = require('apollo-server');
const fs = require('smart-fs');
const path = require('path');

module.exports.loadSchema = () => {
  const server = new ApolloServer({
    typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n')
  });
  return server.schema;
};
