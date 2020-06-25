const parseInfo = require('./modules/parse-info');
const deprecation = require('./modules/deprecation');
const CommentDeprecationPlugin = require('./modules/comment-deprecation-plugin');
const docs = require('./modules/docs');

module.exports.parseInfo = parseInfo;
module.exports.getDeprecationMeta = deprecation.getDeprecationMeta;
module.exports.getDeprecationDetails = deprecation.getDeprecationDetails;
module.exports.CommentDeprecationPlugin = CommentDeprecationPlugin;
module.exports.generateDocs = docs.generateDocs;
module.exports.syncDocs = docs.syncDocs;
