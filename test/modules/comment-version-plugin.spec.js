import { expect } from 'chai';
import { describe } from 'node-tdd';
import get from 'lodash.get';
import CommentVersionPlugin from '../../src/modules/comment-version-plugin.js';
import versions from './versions.js';
import { createServer } from './helper.js';

describe('Testing comment-version-plugin.js', {
  envVars: {
    FORCE_SUNSET: '0',
    VERSION: '0.0.1'
  }
}, () => {
  let server;
  let requestHelper;

  beforeEach(async () => {
    server = await createServer([CommentVersionPlugin({
      apiVersionHeader: 'x-api-version',
      sunsetDurationInDays: 2 * 365,
      forceSunset: process.env.FORCE_SUNSET === '1',
      versions
    })]);
    requestHelper = server.requestHelper;
  });

  afterEach(async () => {
    await server.server.stop();
  });

  it('Testing Sunset and Deprecation headers returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id name } }', true);
    expect(r.data).to.deep.equal({ data: { User: { id: '1', name: 'Name' } } });
    expect(r.headers.deprecation).to.equal('date="Fri, 01 Dec 2000 00:00:00 GMT"');
    expect(r.headers.sunset).to.equal('Sun, 01 Dec 2002 00:00:00 GMT');
  });

  it('Testing Sunset and Deprecation headers returned (nested)', async () => {
    const r = await requestHelper('query User { User(id: "1") { tweets(limit: 10) { id } } }', true);
    expect(r.data).to.deep.equal({ data: { User: { tweets: [{ id: '123' }] } } });
    expect(r.headers.deprecation).to.equal('date="Mon, 25 Apr 2011 00:00:00 GMT"');
    expect(r.headers.sunset).to.equal('Wed, 24 Apr 2013 00:00:00 GMT');
  });

  it('Testing Sunset and Deprecation headers Not returned', async () => {
    const r = await requestHelper('query User { User(id: "1") { id } }', true);
    expect(r.data).to.deep.equal({ data: { User: { id: '1' } } });
    expect(r.headers.deprecation).to.equal(undefined);
    expect(r.headers.sunset).to.equal(undefined);
  });

  it('Testing Sunset and Deprecation headers returned (fragment)', async () => {
    const r = await requestHelper(
      'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
      true
    );
    expect(r.data).to.deep.equal({ data: { User: { id: '1', name: 'Name' } } });
    expect(r.headers.deprecation).to.equal('date="Fri, 01 Dec 2000 00:00:00 GMT"');
    expect(r.headers.sunset).to.equal('Sun, 01 Dec 2002 00:00:00 GMT');
  });

  it('Testing Invalid Query', async () => {
    const r = await requestHelper('query Unknown { Unknown { id } }', false);
    expect(get(r, 'data.errors[0].message')).to.include('Cannot query field "Unknown" on type "Query".');
    expect(r.headers.deprecation).to.equal(undefined);
    expect(r.headers.sunset).to.equal(undefined);
  });

  describe('Testing Force Sunset', { envVars: { '^FORCE_SUNSET': '1' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.data.errors[0].extensions.code).to.equal('DEPRECATION_ERROR');
      expect(r.data.errors[0].message).to.equal('Functionality sunset since "Sun, 01 Dec 2002 00:00:00 GMT".');
    });
  });

  describe('Testing Unsupported Functionality', { envVars: { '^VERSION': '1.0.0' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.data.errors[0].extensions.code).to.equal('DEPRECATION_ERROR');
      expect(r.data.errors[0].message).to.equal('Functionality unsupported for version "1.0.0".');
    });
  });

  describe('Testing Bad Version Header', { envVars: { '^VERSION': 'invalid' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.data.errors[0].extensions.code).to.equal('VERSION_HEADER_INVALID');
      expect(r.data.errors[0].message).to.equal('Missing or invalid api version header "x-api-version".');
    });
  });

  describe('Unknown Api Version', { envVars: { '^VERSION': '0.0.5' } }, () => {
    it('Executing Test', async () => {
      const r = await requestHelper(
        'fragment UserParts on User { id name } query User { User(id: "1") { ...UserParts } }',
        false
      );
      expect(r.data.errors[0].extensions.code).to.equal('VERSION_HEADER_INVALID');
      expect(r.data.errors[0].message).to.equal('Unknown api version "0.0.5" provided for header "x-api-version".');
    });
  });

  describe('Testing required comment', { envVars: { '^VERSION': '1.0.0' } }, () => {
    it('Testing Required and Missing', async () => {
      const r = await requestHelper('query User { User(id: "1") { tweets { id } } }', false);
      expect(r.data.errors[0].extensions.code).to.equal('REQUIRED_ERROR');
      expect(r.data.errors[0].message).to.equal('Some Argument(s) required since version "1.0.0".');
    });

    it('Testing Required and Provided', async () => {
      const r = await requestHelper('query User { User(id: "1") { tweets(cursor: "abc") { id } } }', true);
      expect(r.data).to.deep.equal({ data: { User: { tweets: [{ id: '123' }] } } });
    });
  });
});
