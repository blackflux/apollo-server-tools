const parseInfo = require('./modules/parse-info');
const deprecation = require('./modules/deprecation');
const docs = require('./modules/docs');

module.exports.parseInfo = parseInfo;
module.exports.getDeprecationDate = deprecation.getDeprecationDate;
module.exports.getDeprecationDetails = deprecation.getDeprecationDetails;
module.exports.generateDocs = docs.generateDocs;
module.exports.syncDocs = docs.syncDocs;
