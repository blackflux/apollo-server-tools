import fs from 'smart-fs';
import path from 'path';
import request from 'request-promise';
import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expect } from 'chai';

export const loadSchema = () => makeExecutableSchema({
  typeDefs: fs.smartRead(path.join(fs.dirname(import.meta.url), 'schema.graphql')).join('\n'),
  parseOptions: {
    commentDescriptions: true
  }
});

export const createServer = async (plugins) => {
  let resolverExecuted = false;
  const serverInfo = await new ApolloServer({
    typeDefs: fs.smartRead(path.join(fs.dirname(import.meta.url), 'schema.graphql')).join('\n'),
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
