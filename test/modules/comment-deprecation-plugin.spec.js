const path = require('path');
const fs = require('smart-fs');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const get = require('lodash.get');
const { ApolloServer } = require('apollo-server');
const request = require('request-promise');
const CommentDeprecationPlugin = require('../../src/modules/comment-deprecation-plugin');
const versions = require('./versions');

describe('Testing comment-deprecation-plugin.js', {
  envVars: {
    FORCE_SUNSET: '0',
    VERSION: '0.0.1'
  }
}, () => {
  let serverInfo;
  let requestHelper;
  beforeEach(async () => {
    let resolverExecuted = false;
    serverInfo = await new ApolloServer({
      typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n'),
      resolvers: {
        Query: {
          User: () => {
            resolverExecuted = true;
            return ({ id: '1', name: 'Name' });
          }
        }
      },
      plugins: [CommentDeprecationPlugin({
        apiVersionHeader: 'x-api-version',
        sunsetDurationInDays: 2 * 365,
        forceSunset: process.env.FORCE_SUNSET === '1',
        versions
      })]
    }).listen();
    requestHelper = async (query, resolverExecutedExpect) => {
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
  });

  afterEach(async () => {
    await serverInfo.server.close();
  });

  it('Testing Sunset and Deprecation headers returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id name } }', true);
    expect(r.body).to.deep.equal({ data: { User: { id: '1', name: 'Name' } } });
    expect(r.headers.deprecation).to.equal('date="Fri, 01 Dec 2000 00:00:00 GMT"');
    expect(r.headers.sunset).to.equal('Sun, 01 Dec 2002 00:00:00 GMT');
  });

  it('Testing Sunset and Deprecation headers Not returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id } }', true);
    expect(r.body).to.deep.equal({ data: { User: { id: '1' } } });
    expect(r.headers.deprecation).to.equal(undefined);
    expect(r.headers.sunset).to.equal(undefined);
  });

  it('Testing Sunset and Deprecation headers returned (fragment)', async () => {
    const r = await requestHelper(
      'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
      true
    );
    expect(r.body).to.deep.equal({ data: { User: { id: '1', name: 'Name' } } });
    expect(r.headers.deprecation).to.equal('date="Fri, 01 Dec 2000 00:00:00 GMT"');
    expect(r.headers.sunset).to.equal('Sun, 01 Dec 2002 00:00:00 GMT');
  });

  it('Testing Invalid Query', async () => {
    const r = await requestHelper('query Unknown { Unknown { id } }', false);
    expect(get(r, 'body.errors[0].message')).to.include('Cannot query field "Unknown" on type "Query".');
    expect(r.headers.deprecation).to.equal(undefined);
    expect(r.headers.sunset).to.equal(undefined);
  });

  describe('Testing Force Sunset', { envVars: { '^FORCE_SUNSET': '1' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.body.errors[0].extensions.code).to.equal('DEPRECATION_ERROR');
      expect(r.body.errors[0].message).to.equal('Functionality sunset since "Sun, 01 Dec 2002 00:00:00 GMT".');
    });
  });

  describe('Testing Unsupported Functionality', { envVars: { '^VERSION': '1.0.0' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.body.errors[0].extensions.code).to.equal('DEPRECATION_ERROR');
      expect(r.body.errors[0].message).to.equal('Functionality unsupported for version "1.0.0".');
    });
  });

  describe('Testing Bad Version Header', { envVars: { '^VERSION': 'invalid' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.body.errors[0].extensions.code).to.equal('VERSION_HEADER_INVALID');
      expect(r.body.errors[0].message).to.equal('Missing or invalid api version header "x-api-version".');
    });
  });

  describe('Unknown Api Version', { envVars: { '^VERSION': '0.0.5' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.body.errors[0].extensions.code).to.equal('VERSION_HEADER_INVALID');
      expect(r.body.errors[0].message).to.equal('Unknown api version "0.0.5" provided for header "x-api-version".');
    });
  });
});
