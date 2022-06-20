import { ApolloError } from 'apollo-server-errors';

export default (code, message, callback) => {
  callback(code, message);
  throw new ApolloError(message, code);
};
