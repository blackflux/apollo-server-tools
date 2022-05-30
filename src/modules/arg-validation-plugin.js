import Joi from 'joi-strict';
import objectScan from 'object-scan';
import { ApolloError } from 'apollo-server-errors';

export default (cb) => {
  Joi.assert(cb, Joi.function());
  const scanner = objectScan([
    'definitions.**(^selectionSet$|^selections$).arguments.value.value'
  ], {
    useArraySelector: false,
    filterFn: ({ parents, property, value }) => {
      const { operation } = parents.find(({ kind }) => kind === 'OperationDefinition');
      const path = parents
        .filter(({ kind }) => ['Field', 'Argument'].includes(kind))
        .map((p) => p.name.value)
        .reverse();
      const kwargs = {
        operation,
        path: path.join('.'),
        kind: parents[0].kind,
        name: path[path.length - 1],
        value
      };
      try {
        // eslint-disable-next-line no-param-reassign
        parents[0][property] = cb(kwargs);
        return false;
      } catch (e) {
        return true;
      }
    },
    breakFn: ({ isCircular }) => isCircular === true,
    rtn: 'parent',
    abort: true
  });

  return {
    requestDidStart() {
      return {
        executionDidStart({ document }) {
          const error = scanner(document);
          if (error) {
            throw new ApolloError(
              'Invalid Argument Provided.',
              'BAD_USER_INPUT'
            );
          }
        }
      };
    }
  };
};
