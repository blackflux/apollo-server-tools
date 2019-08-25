const parseInfo = require('./modules/parse-info');
const deprecation = require('./modules/deprecation');

module.exports.parseInfo = parseInfo;
module.exports.getDeprecationDate = deprecation.getDeprecationDate;
module.exports.getDeprecationDetails = deprecation.getDeprecationDetails;
