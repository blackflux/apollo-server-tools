/* eslint-disable mocha/no-setup-in-describe */
const path = require('path');
const fs = require('smart-fs');
const { parse } = require('graphql');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const parseInfo = require('../../src/modules/parse-info');

const getDirectories = (dir) => fs.readdirSync(dir)
  .filter((subDir) => fs.lstatSync(path.join(dir, subDir)).isDirectory());

describe('Testing fields util.', () => {
  describe('Testing graphql-parse', () => {
    const root = path.join(__dirname, 'parse-info', 'graphql-parse');
    getDirectories(root).forEach((testDir) => {
      it(`Testing ${testDir}`, () => {
        const query = fs.smartRead(path.join(root, testDir, 'query.graphql')).join('\n');
        const vars = fs.smartRead(path.join(root, testDir, 'variables.json'));
        const result = fs.smartRead(path.join(root, testDir, 'result.json'));
        const document = parse(query);
        expect(parseInfo(document, vars)).to.deep.equal(result);
      });
    });
  });

  describe('Testing resolver-info', () => {
    const root = path.join(__dirname, 'parse-info', 'resolver-info');
    getDirectories(root).forEach((testDir) => {
      it(`Testing ${testDir}`, () => {
        const info = fs.smartRead(path.join(root, testDir, 'info.json'));
        const result = fs.smartRead(path.join(root, testDir, 'result.json'));
        expect(parseInfo(info)).to.deep.equal(result);
      });
    });
  });

  it('Testing unknown selection kind provided.', () => {
    expect(() => parseInfo({ fieldNodes: [{ kind: 'Unknown' }] }).fields)
      .to.throw('Unexpected Kind: Unknown');
  });
});
