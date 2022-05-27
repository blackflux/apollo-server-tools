import parseInfo_ from './modules/parse-info.js';
import * as deprecation from './modules/deprecation.js';
import CommentVersionPlugin_ from './modules/comment-version-plugin.js';
import ArgValidationPlugin_ from './modules/arg-validation-plugin.js';
import * as docs from './modules/docs.js';

export const parseInfo = parseInfo_;
export const getDeprecationMeta = deprecation.getDeprecationMeta;
export const getDeprecationDetails = deprecation.getDeprecationDetails;
export const CommentVersionPlugin = CommentVersionPlugin_;
export const ArgValidationPlugin = ArgValidationPlugin_;
export const generateDocs = docs.generateDocs;
export const syncDocs = docs.syncDocs;
