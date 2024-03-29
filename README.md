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

<!-- eslint-disable import/no-unresolved,import/no-extraneous-dependencies,no-console -->
```js
import path from 'path';
import fs from 'smart-fs';
import { syncDocs, CommentVersionPlugin } from 'apollo-server-tools';
import { ApolloServer } from 'apollo-server';
import axios from 'axios';
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
    type Query {
        "[deprecated] 1.0.0 Deprecated, add reason and what to do..."
        messages: [Message!]!
    }
    "[deprecated] 2.0.0 Also Deprecated, notice the date"
    type Message {
        id: String
        "[deprecated] 3.0.0 Yep, Deprecated, we can deprecate everything now"
        content: String
        "[required] 3.0.0"
        payload: String
    }
`;
const resolvers = {
  Query: {
    messages: () => [
      { id: 1, content: 'Data', payload: null }
    ]
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [CommentVersionPlugin({
    apiVersionHeader: 'x-api-version',
    forceSunset: false,
    sunsetDurationInDays: 7 * 52,
    versions: {
      '0.0.1': '2018-01-01',
      '1.0.0': '2019-01-01',
      '2.0.0': '2019-02-02',
      '3.0.0': '2019-03-03'
    }
  })],
  parseOptions: {
    // allows line comments as per https://github.com/ardatan/graphql-tools/issues/3645#issuecomment-934653324
    commentDescriptions: true
  },
  introspection: false // clients should obtain this from the generated file (see below)
});

// --- deprecation header are returned when deprecated functionality is accessed

server.listen().then(async (serverInfo) => {
  const r = await axios({
    method: 'POST',
    url: `${serverInfo.url}graphql`,
    data: { query: 'query Messages { messages { id, content } }' },
    headers: {
      'x-api-version': '0.0.1'
    }
  });
  // As per example https://tools.ietf.org/html/draft-dalal-deprecation-header-00#section-5
  console.log('Deprecation Header:', r.headers.deprecation);
  console.log('Sunset Header:', r.headers.sunset);
  console.log('Response Body:', JSON.stringify(r.data));
  serverInfo.server.close();
});

// --- how you could sync graph api documentation to file
syncDocs(
  path.join(fs.dirname(import.meta.url), 'graph-docs.json'),
  makeExecutableSchema({ typeDefs, parseOptions: {} })
);
```

## Functions

### parseInfo({ ast, fragments = {}, vars = {} })

Parse info object to easily access relevant information.

### getDeprecationMeta({ versions, sunsetDurationInDays, schema, ast, fragments = {}, vars = {} })

Parse out relevant deprecation information for all accessed functionality.

Expects custom deprecation syntax, see below.

The `versions` parameter is expected to be an object mapping versions to their respective introduction [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

Can e.g. be used to return a `Sunset` header.

### getDeprecationDetails({ schema, ast, fragments = {}, vars = {} })

Fetch deprecated entities that are accessed by the query. Expects custom deprecation syntax, see below.

### CommentVersionPlugin({ sunsetDurationInDays: Integer, forceSunset: Boolean, versions: Object })

Graphql Plugin that injects appropriate headers into responses.

If forceSunset is set to true and sunset functionality is accessed, an error is thrown.

Versions is expected to be an object mapping versions to their creation date string as "YYYY-MM-DD".

Can make optional arguments required from a certain version by using e.g `[required] 1.0.0` as a comment.

### ArgValidationPlugin(cb: Function)

Used to do extra validation on all arguments. Can be used to
reject certain input by returning false from callback

See test and code for additional details.

## syncDocs(filepath, schema, stripDeprecated = true)

Write introspection result into file. Order is stable. Returns true iff the content has changed. Deprecated entities are removed if option is set. Expects custom deprecation syntax, see below.

## generateDocs(schema, stripDeprecated = true)

Generate and return introspection result. Deprecated entities are removed if option is set. Expects custom deprecation syntax, see below.

## Deprecation Syntax

Deprecation functionality is very limited in graphql. This tool allows overloading of comments, which means that everything in the schema can be deprecated.

The deprecation comment is expected to be in the form `[deprecated] YYYY-MM-DD description`, where the date indicates the date of deprecation.
