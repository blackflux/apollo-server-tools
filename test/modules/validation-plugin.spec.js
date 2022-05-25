const expect = require('chai').expect;
const { describe } = require('node-tdd');
const ValidationPlugin = require('../../src/modules/validation-plugin');
const { createServer } = require('./helper');

describe('Testing comment-version-plugin.js', {}, () => {
  let serverInfo;
  let requestHelper;
  beforeEach(async () => {
    const server = await createServer([ValidationPlugin({})]);
    serverInfo = server.serverInfo;
    requestHelper = server.requestHelper;
  });

  afterEach(async () => {
    await serverInfo.server.close();
  });

  it('Testing empty string throws error', async () => {
    const r1 = await requestHelper('query User { User(id: "1") { id } }', true);
    expect(r1.body).to.deep.equal({ data: { User: { id: '1' } } });
    const r2 = await requestHelper('query User { User(id: "") { id } }', false);
    expect(r2.body.errors[0].message).to.equal('Empty String Provided.');
  });
});
