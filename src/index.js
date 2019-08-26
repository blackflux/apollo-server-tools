const parseInfo = require('./modules/parse-info');
const deprecation = require('./modules/deprecation');
const CommentDeprecationExtension = require('./modules/comment-deprecation-extension');
const docs = require('./modules/docs');

module.exports.parseInfo = parseInfo;
module.exports.getDeprecationDate = deprecation.getDeprecationDate;
module.exports.getDeprecationDetails = deprecation.getDeprecationDetails;
module.exports.CommentDeprecationExtension = CommentDeprecationExtension;
module.exports.generateDocs = docs.generateDocs;
module.exports.syncDocs = docs.syncDocs;
