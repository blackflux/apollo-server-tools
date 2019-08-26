const assert = require('assert');
const { GraphQLExtension } = require('graphql-extensions');
const { getDeprecationDate } = require('./deprecation');

class CommentDeprecationExtension extends GraphQLExtension {
  constructor(sunsetInDays = 2 * 365) {
    super();
    this.sunsetInDays = sunsetInDays;
    this.deprecationDate = undefined;
  }

  executionDidStart({ executionArgs }) {
    assert(this.deprecationDate === undefined);
    this.deprecationDate = getDeprecationDate({
      schema: executionArgs.schema,
      ast: executionArgs.document
    });
  }

  willSendResponse(kwargs) {
    const { graphqlResponse } = kwargs;
    if (this.deprecationDate !== null) {
      graphqlResponse.http.headers.set('Deprecation', `date="${this.deprecationDate.toUTCString()}"`);
      const sunsetDate = new Date();
      sunsetDate.setTime(this.deprecationDate.getTime() + this.sunsetInDays * 24 * 60 * 60 * 1000);
      graphqlResponse.http.headers.set('Sunset', sunsetDate.toUTCString());
    }
    return kwargs;
  }
}
module.exports = CommentDeprecationExtension;
