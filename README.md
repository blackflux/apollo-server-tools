# apollo-server-tools

[![Build Status](https://circleci.com/gh/blackflux/apollo-server-tools.png?style=shield)](https://circleci.com/gh/blackflux/apollo-server-tools)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/apollo-server-tools/master.svg)](https://coveralls.io/github/blackflux/apollo-server-tools?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/apollo-server-tools)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/apollo-server-tools/status.svg)](https://david-dm.org/blackflux/apollo-server-tools)
[![NPM](https://img.shields.io/npm/v/apollo-server-tools.svg)](https://www.npmjs.com/package/apollo-server-tools)
[![Downloads](https://img.shields.io/npm/dt/apollo-server-tools.svg)](https://www.npmjs.com/package/apollo-server-tools)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

Helper for apollo-server

## Install

Install with [npm](https://www.npmjs.com/):

    $ npm install --save apollo-server-tools

## Example

<!-- eslint-disable import/no-unresolved,import/no-extraneous-dependencies,class-methods-use-this,no-console -->
```js
const path = require('path');
const { createServer } = require('http');
const get = require('lodash.get');
const set = require('lodash.set');
const { GraphQLExtension } = require('graphql-extensions');
const { ApolloServer } = require('apollo-server-express');
const { getDeprecationDate, syncDocs } = require('apollo-server-tools');
const express = require('express');
const request = require('request-promise');

// --- standard graphql server setup

const app = express();
const typeDefs = `
    type Query {
        # [deprecated] 2019-01-01 Deprecated, add reason and what to do...
        messages: [Message!]!
    }
    # [deprecated] 2019-02-02 Also Deprecated, notice the date
    type Message {
        id: String
        # [deprecated] 2019-03-03 Yep, Deprecated, we can deprecate everything now
        content: String
    }
`;
const resolvers = {
  Query: {
    messages: () => [
      { id: 1, content: 'Data', payload: null }
    ]
  }
};

// --- custom deprecation setup

Object.values(resolvers).forEach((queryTypeResolver) => {
  Object.entries(queryTypeResolver).forEach(([resolverName, resolverFn]) => {
    Object.assign(queryTypeResolver, {
      [resolverName]: (obj, args, context, info) => {
        const deprecationDate = getDeprecationDate(info.schema, info.operation);
        if (deprecationDate !== null) {
          set(context, 'context.custom.headers.Deprecation', `date="${deprecationDate.toUTCString()}"`);
          const sunsetDate = new Date();
          sunsetDate.setTime(deprecationDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
          set(context, 'context.custom.headers.Sunset', sunsetDate.toUTCString());
        }
        return resolverFn(obj, args, context, info);
      }
    });
  });
});

class HeaderInjector extends GraphQLExtension {
  willSendResponse(kwargs) {
    const { context, graphqlResponse } = kwargs;
    Object
      .entries(get(context, 'context.custom.headers', {}))
      .filter(([name, value]) => typeof value === 'string')
      .forEach(([name, value]) => {
        graphqlResponse.http.headers.set(name, value);
      });
    return kwargs;
  }
}

// --- continue standard graphql server setup

const server = new ApolloServer({
  typeDefs,
  resolvers,
  extensions: [() => new HeaderInjector()],
  introspection: false // clients should obtain this from the generated file (see below)
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

// --- deprecation header are returned when deprecated functionality is accessed

httpServer.listen({ port: 8000 }, async () => {
  const r = await request({
    method: 'POST',
    uri: 'http://localhost:8000/graphql',
    json: true,
    body: { query: 'query Messages { messages { id, content } }' },
    resolveWithFullResponse: true
  });
  // As per example https://tools.ietf.org/html/draft-dalal-deprecation-header-00#section-5
  console.log('Deprecation Header:', r.headers.deprecation);
  console.log('Sunset Header:', r.headers.sunset);
  console.log('Response Body:', JSON.stringify(r.body));
  httpServer.close();
});

// --- how you could sync graph api documentation to file

syncDocs(path.join(__dirname, 'graph-docs.json'), server.schema);

```

## Functions

### parseInfo(info, vars = {})

Parse info object to easily access relevant information.

### getDeprecationDate(schema, queryAst)

Fetch nearest deprecation date that is accessed by the query as date object.
Returns `null` when there is no deprecated access. Expects custom deprecation syntax, see below.

Can e.g. be used to return a `Sunset` header.

### getDeprecationDetails(schema, queryAst)

Fetch deprecated entities that are accessed by the query. Expects custom deprecation syntax, see below.

## syncDocs(filepath, schema, stripDeprecated = true)

Write introspection result into file. Order is stable. Returns true iff the content has changed. Deprecated entities are removed if option is set. Expects custom deprecation syntax, see below.

## generateDocs(schema, stripDeprecated = true)

Generate and return introspection result. Deprecated entities are removed if option is set. Expects custom deprecation syntax, see below.

## Deprecation Syntax

Deprecation functionality is very limited in graphql. This tool allows overloading of comments, which means that everything in the schema can be deprecated.

The deprecation comment is expected to be in the form `[deprecated] YYYY-MM-DD description`, where the date indicates the date of deprecation.
