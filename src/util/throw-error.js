import { ApolloError } from 'apollo-server-errors';

export default (code, message, callback, context) => {
  callback({ code, message, context });
  throw new ApolloError(message, code);
};
