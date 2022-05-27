import path from 'path';
import fs from 'smart-fs';
import { expect } from 'chai';
import { describe } from 'node-tdd';
import { generateDocs, syncDocs } from '../../src/modules/docs.js';
import { loadSchema } from './helper.js';

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
        path.join(fs.dirname(import.meta.url), 'docs', 'introspection-result-excludes-deprecated.json'),
        docs
      );
      expect(result).to.equal(false);
    });

    it('Introspection includes deprecated', () => {
      const docs = generateDocs(schema, false);
      expect(JSON.stringify(docs)).to.include(['[deprecated]']);
      const result = fs.smartWrite(
        path.join(fs.dirname(import.meta.url), 'docs', 'introspection-result-includes-deprecated.json'),
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
