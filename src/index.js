const parseInfo = require('./modules/parse-info');
const deprecation = require('./modules/deprecation');
const CommentVersionPlugin = require('./modules/comment-version-plugin');
const ValidationPlugin = require('./modules/validation-plugin');
const docs = require('./modules/docs');

module.exports.parseInfo = parseInfo;
module.exports.getDeprecationMeta = deprecation.getDeprecationMeta;
module.exports.getDeprecationDetails = deprecation.getDeprecationDetails;
module.exports.CommentVersionPlugin = CommentVersionPlugin;
module.exports.ValidationPlugin = ValidationPlugin;
module.exports.generateDocs = docs.generateDocs;
module.exports.syncDocs = docs.syncDocs;
