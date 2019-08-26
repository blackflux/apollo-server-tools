const path = require('path');
const fs = require('smart-fs');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const { ApolloServer } = require('apollo-server');
const request = require('request-promise');
const CommentDeprecationExtension = require('../../src/modules/comment-deprecation-extension');

describe('Testing comment-deprecation-extension.js', () => {
  let meta;
  let requestHelper;
  before(async () => {
    meta = await new Promise((resolve) => new ApolloServer({
      typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n'),
      resolvers: { Query: { User: () => ({ id: '1', name: 'Name' }) } },
      extensions: [() => new CommentDeprecationExtension()]
    }).listen().then(resolve));
    requestHelper = (query) => request({
      method: 'post',
      uri: `${meta.url}graphql`,
      json: true,
      body: { query },
      resolveWithFullResponse: true
    });
  });

  after(async () => {
    await meta.server.close();
  });

  it('Testing Sunset and Deprecation headers returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id name } }');
    expect(r.body).to.deep.equal({ data: { User: { id: '1', name: 'Name' } } });
    expect(r.headers.deprecation).to.equal('Fri, 01 Dec 2000 00:00:00 GMT');
    expect(r.headers.sunset).to.equal('Sun, 01 Dec 2002 00:00:00 GMT');
  });

  it('Testing Sunset and Deprecation headers Noy returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id } }');
    expect(r.body).to.deep.equal({ data: { User: { id: '1' } } });
    expect(r.headers.deprecation).to.equal(undefined);
    expect(r.headers.sunset).to.equal(undefined);
  });
});
