/* eslint-disable mocha/no-setup-in-describe */
const path = require('path');
const fs = require('smart-fs');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const { parse, validate } = require('graphql');
const { ApolloServer } = require('apollo-server');
const { getDirectories } = require('../util');
const { getRequireDetails, getRequireMeta } = require('../../src/modules/require');
const versions = require('./versions');

describe('Testing require.js', () => {
  let schema;
  before(() => {
    schema = new ApolloServer({
      typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n')
    }).schema;
  });

  describe('Testing queries', () => {
    const root = path.join(__dirname, 'require', 'queries');
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
