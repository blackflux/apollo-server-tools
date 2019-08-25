# apollo-server-tools

[![Build Status](https://circleci.com/gh/blackflux/apollo-server-tools.png?style=shield)](https://circleci.com/gh/blackflux/apollo-server-tools)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/apollo-server-tools/master.svg)](https://coveralls.io/github/blackflux/apollo-server-tools?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/apollo-server-tools)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/apollo-server-tools/status.svg)](https://david-dm.org/blackflux/apollo-server-tools)
[![NPM](https://img.shields.io/npm/v/apollo-server-tools.svg)](https://www.npmjs.com/package/apollo-server-tools)
[![Downloads](https://img.shields.io/npm/dt/apollo-server-tools.svg)](https://www.npmjs.com/package/apollo-server-tools)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

Helper for apollo-server

## Install

Install with [npm](https://www.npmjs.com/):

    $ npm install --save apollo-server-tools

## Example

// TODO: ...

## Functions

### parseInfo(info, vars = {})

Parse info object to easily access relevant information.

### getDeprecationDate(schema, queryAst, offsetInDays = 0)

Fetch nearest deprecation date that is accessed by the query as `http-date` string.
Returns `null` no deprecated access. Expected custom deprecation syntax, see below.

Can e.g. be used to return a `Sunset` header.

### getDeprecationDetails(schema, queryAst)

Fetch deprecated entities that accessed by the query. Expected custom deprecation syntax, see below.

## Deprecation Syntax

Deprecation functionality is very limited in graphql. This tool allows a workaround syntax by overloading the comments. Anything in the graphql schema can now be deprecated.

The comment is expected to be in the form of `[deprecated] YYYY-MM-DD description`, where the date indicates the date of deprecation.
