/* eslint-disable mocha/no-setup-in-describe */
import path from 'path';
import fs from 'smart-fs';
import { expect } from 'chai';
import { describe } from 'node-tdd';
import { parse, validate } from 'graphql';
import { getDirectories } from '../util.js';
import { getRequireDetails, getRequireMeta } from '../../src/modules/require.js';
import versions from './versions.js';
import { loadSchema } from './helper.js';

describe('Testing require.js', () => {
  let schema;

  before(() => {
    schema = loadSchema();
  });

  describe('Testing queries', () => {
    const root = path.join(fs.dirname(import.meta.url), 'require', 'queries');
    getDirectories(root).forEach((d) => {
      it(`Testing ${d}`, () => {
        const ast = parse(fs.smartRead(path.join(root, d, 'query.graphql')).join('\n'));
        const expectedResult = fs.smartRead(path.join(root, d, 'result.json'));
        const expectedRequireMeta = fs.smartRead(path.join(root, d, 'require.json'));
        expect(validate(schema, ast)).to.deep.equal([]);

        const result = getRequireDetails({ schema, ast }).map((e) => ({
          name: e.name,
          description: e.description
        }));
        const requireMeta = getRequireMeta({
          versions: Object.fromEntries(Object.entries(versions).map(([k, v]) => [k, new Date(v)])),
          sunsetDurationInDays: 1,
          schema,
          ast
        });
        expect(result).to.deep.equal(expectedResult);
        expect(JSON.parse(JSON.stringify(requireMeta)))
          .to.deep.equal(expectedRequireMeta);
      });
    });
  });
});
