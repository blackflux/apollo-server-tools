/* eslint-disable mocha/no-setup-in-describe */
import path from 'path';
import fs from 'smart-fs';
import { parse } from 'graphql';
import { expect } from 'chai';
import { describe } from 'node-tdd';
import { getDirectories } from '../util.js';
import parseInfo from '../../src/modules/parse-info.js';

describe('Testing parse-info.js', () => {
  describe('Testing graphql-parse', () => {
    const root = path.join(fs.dirname(import.meta.url), 'parse-info', 'graphql-parse');
    getDirectories(root).forEach((testDir) => {
      it(`Testing ${testDir}`, () => {
        const query = fs.smartRead(path.join(root, testDir, 'query.graphql')).join('\n');
        const vars = fs.smartRead(path.join(root, testDir, 'variables.json'));
        const result = fs.smartRead(path.join(root, testDir, 'result.json'));
        const ast = parse(query);
        expect(parseInfo({ ast, vars })).to.deep.equal(result);
      });
    });
  });

  describe('Testing resolver-info', () => {
    const root = path.join(fs.dirname(import.meta.url), 'parse-info', 'resolver-info');
    getDirectories(root).forEach((testDir) => {
      it(`Testing ${testDir}`, () => {
        const ast = fs.smartRead(path.join(root, testDir, 'ast.json'));
        const result = fs.smartRead(path.join(root, testDir, 'result.json'));
        expect(parseInfo({ ast })).to.deep.equal(result);
      });
    });
  });

  it('Testing unknown selection kind provided.', () => {
    expect(() => parseInfo({ ast: { fieldNodes: [{ kind: 'Unknown' }] } }).fields)
      .to.throw('Unexpected Kind: Unknown');
  });
});
