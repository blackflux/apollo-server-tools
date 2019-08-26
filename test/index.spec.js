const expect = require('chai').expect;
const { describe } = require('node-tdd');
const index = require('../src/index');

describe('Testing index.js', () => {
  it('Testing Exports', () => {
    expect(Object.keys(index)).to.deep.equal([
      'parseInfo',
      'getDeprecationDate',
      'getDeprecationDetails',
      'CommentDeprecationExtension',
      'generateDocs',
      'syncDocs'
    ]);
  });
});
