const { GraphQLExtension } = require('graphql-extensions');
const { getDeprecationDate } = require('./deprecation');

class CommentDeprecationExtension extends GraphQLExtension {
  constructor(sunsetInDays = 2 * 365) {
    super();
    this.sunsetInDays = sunsetInDays;
    this.deprecationDate = null;
  }

  willResolveField(obj, args, context, info) {
    const deprecationDate = getDeprecationDate(info.schema, info.operation);
    if (deprecationDate !== null && (this.deprecationDate === null || deprecationDate < this.deprecationDate)) {
      this.deprecationDate = deprecationDate;
    }
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
