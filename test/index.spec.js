import { expect } from 'chai';
import { describe } from 'node-tdd';
import * as index from '../src/index.js';

describe('Testing index.js', () => {
  it('Testing Exports', () => {
    expect(Object.keys(index)).to.deep.equal([
      'ArgValidationPlugin',
      'CommentVersionPlugin',
      'generateDocs',
      'getDeprecationDetails',
      'getDeprecationMeta',
      'parseInfo',
      'syncDocs'
    ]);
  });
});
