/* eslint-disable mocha/no-setup-in-describe */
import path from 'path';
import fs from 'smart-fs';
import { expect } from 'chai';
import { describe } from 'node-tdd';
import { parse, validate } from 'graphql';
import { getDirectories } from '../util.js';
import { getDeprecationDetails, getDeprecationMeta } from '../../src/modules/deprecation.js';
import versions from './versions.js';
import { loadSchema } from './helper.js';

describe('Testing deprecation.js', () => {
  let schema;

  before(() => {
    schema = loadSchema();
  });

  describe('Testing queries', () => {
    const root = path.join(fs.dirname(import.meta.url), 'deprecation', 'queries');
    getDirectories(root).forEach((d) => {
      it(`Testing ${d}`, () => {
        const ast = parse(fs.smartRead(path.join(root, d, 'query.graphql')).join('\n'));
        const expectedResult = fs.smartRead(path.join(root, d, 'result.json'));
        const expectedDeprecationMeta = fs.smartRead(path.join(root, d, 'deprecation.json'));
        expect(validate(schema, ast)).to.deep.equal([]);

        const result = getDeprecationDetails({ schema, ast }).map((e) => ({
          name: e.name,
          description: e.description
        }));
        const deprecationMeta = getDeprecationMeta({
          versions: Object.fromEntries(Object.entries(versions).map(([k, v]) => [k, new Date(v)])),
          sunsetDurationInDays: 1,
          schema,
          ast
        });
        expect(result).to.deep.equal(expectedResult);
        expect(JSON.parse(JSON.stringify(deprecationMeta)))
          .to.deep.equal(expectedDeprecationMeta);
      });
    });
  });
});
