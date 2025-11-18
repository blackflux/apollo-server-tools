import { GraphQLError } from 'graphql';

export default (code, message, callback, context) => {
  callback({ code, message, context });
  throw new GraphQLError(message, { extensions: { code } });
};
