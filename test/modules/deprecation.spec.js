/* eslint-disable mocha/no-setup-in-describe */
const path = require('path');
const fs = require('smart-fs');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const { parse, validate } = require('graphql');
const { ApolloServer } = require('apollo-server');
const { getDirectories } = require('../util');
const { getDeprecationDetails, getDeprecationDate } = require('../../src/modules/deprecation');

describe('Testing deprecation.js', () => {
  let schema;
  before(() => {
    schema = new ApolloServer({
      typeDefs: fs.smartRead(path.join(__dirname, 'schema.graphql')).join('\n')
    }).schema;
  });

  describe('Testing queries', () => {
    const root = path.join(__dirname, 'deprecation', 'queries');
    getDirectories(root).forEach((d) => {
      it(`Testing ${d}`, () => {
        const ast = parse(fs.smartRead(path.join(root, d, 'query.graphql')).join('\n'));
        const expectedResult = fs.smartRead(path.join(root, d, 'result.json'));
        const expectedDeprecationDate = fs.smartRead(path.join(root, d, 'deprecation.json'));
        expect(validate(schema, ast)).to.deep.equal([]);

        const result = getDeprecationDetails({ schema, ast }).map((e) => ({
          name: e.name,
          description: e.description
        }));
        const deprecationDate = getDeprecationDate({ schema, ast });
        expect(result).to.deep.equal(expectedResult);
        expect(deprecationDate === null ? null : deprecationDate.toUTCString())
          .to.equal(expectedDeprecationDate);
      });
    });
  });
});
