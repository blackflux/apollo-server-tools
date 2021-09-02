const path = require('path');
const fs = require('smart-fs');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const { generateDocs, syncDocs } = require('../../src/modules/docs');
const { loadSchema } = require('./helper');

describe('Testing docs.js', () => {
  let schema;
  before(() => {
    schema = loadSchema();
  });

  describe('Testing generateDocs', () => {
    it('Introspection excludes deprecated', () => {
      const docs = generateDocs(schema);
      expect(JSON.stringify(docs)).to.not.include(['[deprecated]']);
      const result = fs.smartWrite(
        path.join(__dirname, 'docs', 'introspection-result-excludes-deprecated.json'),
        docs
      );
      expect(result).to.equal(false);
    });

    it('Introspection includes deprecated', () => {
      const docs = generateDocs(schema, false);
      expect(JSON.stringify(docs)).to.include(['[deprecated]']);
      const result = fs.smartWrite(
        path.join(__dirname, 'docs', 'introspection-result-includes-deprecated.json'),
        docs
      );
      expect(result).to.equal(false);
    });
  });

  describe('Testing syncDocs', { useTmpDir: true }, () => {
    it('Testing overwrite feedback', ({ dir }) => {
      const filePath = path.join(dir, 'file.json');
      expect(syncDocs(filePath, schema)).to.equal(true);
      expect(syncDocs(filePath, schema)).to.equal(false);
      expect(syncDocs(filePath, schema, false)).to.equal(true);
      expect(syncDocs(filePath, schema, false)).to.equal(false);
    });
  });
});
