import { expect } from 'chai';
import { describe } from 'node-tdd';
import ArgValidationPlugin from '../../src/modules/arg-validation-plugin.js';
import { createServer } from './helper.js';

describe('Testing arg-validation-plugin.js', {}, () => {
  let serverInfo;
  let requestHelper;
  beforeEach(async () => {
    const server = await createServer([ArgValidationPlugin({
      reject: ['', 'undefined']
    })]);
    serverInfo = server.serverInfo;
    requestHelper = server.requestHelper;
  });

  afterEach(async () => {
    await serverInfo.server.close();
  });

  it('Testing string with length does not throw', async () => {
    const r = await requestHelper('query User { User(id: "1") { id } }', true);
    expect(r.body).to.deep.equal({ data: { User: { id: '1' } } });
  });

  it('Testing empty string throws error', async () => {
    const r = await requestHelper('query User { User(id: "") { id } }', false);
    expect(r.body.errors[0].message).to.equal('Invalid Argument Provided.');
  });

  it('Testing space string throws error', async () => {
    const r = await requestHelper('query User { User(id: " ") { id } }', false);
    expect(r.body.errors[0].message).to.equal('Invalid Argument Provided.');
  });

  it('Testing "undefined" string throws error', async () => {
    const r = await requestHelper('query User { User(id: "undefined") { id } }', false);
    expect(r.body.errors[0].message).to.equal('Invalid Argument Provided.');
  });

  it('Testing nested empty string throws error', async () => {
    const r = await requestHelper('query User { User(id: "1") { tweets(cursor: "") { id } } }', false);
    expect(r.body.errors[0].message).to.equal('Invalid Argument Provided.');
  });

  it('Testing empty string in mutation throws error', async () => {
    const r = await requestHelper('mutation Mutation { deleteTweet(id: "") { id } }', false);
    expect(r.body.errors[0].message).to.equal('Invalid Argument Provided.');
  });
});
