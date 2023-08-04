import path from 'path';
import fs from 'smart-fs';
import axios from 'axios';
import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expect } from 'chai';

export const loadSchema = () => makeExecutableSchema({
  typeDefs: fs.smartRead(path.join(fs.dirname(import.meta.url), 'schema.graphql')).join('\n'),
  parseOptions: {}
});

export const createServer = async (plugins) => {
  let resolverExecuted = false;
  const serverInfo = await new ApolloServer({
    typeDefs: fs.smartRead(path.join(fs.dirname(import.meta.url), 'schema.graphql')).join('\n'),
    resolvers: {
      Query: {
        User: (_, args) => {
          resolverExecuted = true;
          return ({
            id: '1',
            name: 'Name',
            tweets: [{ id: '123' }],
            args: JSON.stringify(args)
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
    const r = await axios({
      method: 'post',
      url: `${serverInfo.url}graphql`,
      data: { query },
      headers: {
        ...(process.env.VERSION ? { 'x-api-version': process.env.VERSION } : {})
      },
      validateStatus: () => true
    });
    expect(resolverExecuted, 'Endpoint Access / Not Accessed')
      .to.equal(resolverExecutedExpect);
    return r;
  };
  return { serverInfo, requestHelper };
};
