const fs = require('smart-fs');
const path = require('path');
const request = require('request-promise');
const { ApolloServer } = require('apollo-server');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { expect } = require('chai');

module.exports.loadSchema = () => makeExecutableSchema({
  typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n'),
  parseOptions: {
    commentDescriptions: true
  }
});

module.exports.createServer = async (plugins) => {
  let resolverExecuted = false;
  const serverInfo = await new ApolloServer({
    typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n'),
    resolvers: {
      Query: {
        User: () => {
          resolverExecuted = true;
          return ({
            id: '1',
            name: 'Name',
            tweets: [{ id: '123' }]
          });
        }
      }
    },
    plugins,
    parseOptions: {
      commentDescriptions: true
    }
  }).listen();
  const requestHelper = async (query, resolverExecutedExpect) => {
    resolverExecuted = false;
    const r = await request({
      method: 'post',
      uri: `${serverInfo.url}graphql`,
      json: true,
      body: { query },
      headers: {
        'x-api-version': process.env.VERSION
      },
      resolveWithFullResponse: true,
      simple: false
    });
    expect(resolverExecuted, 'Endpoint Access / Not Accessed')
      .to.equal(resolverExecutedExpect);
    return r;
  };
  return { serverInfo, requestHelper };
};
