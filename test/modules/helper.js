import path from 'path';
import fs from 'smart-fs';
import axios from 'axios';
import { ApolloServer } from '@apollo/server';
// eslint-disable-next-line import/extensions
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { expect } from 'chai';

export const loadSchema = () => makeExecutableSchema({
  typeDefs: fs.smartRead(path.join(fs.dirname(import.meta.url), 'schema.graphql')).join('\n'),
  parseOptions: {}
});

export const createServer = async (plugins) => {
  let resolverExecuted = false;
  const server = new ApolloServer({
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
  });
  const serverInfo = await startStandaloneServer(server, {
    listen: { port: 4000 }
  });
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
  return { server, serverInfo, requestHelper };
};
