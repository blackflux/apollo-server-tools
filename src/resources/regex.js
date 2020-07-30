const versionRegex = '\\d+\\.\\d+\\.\\d+';

module.exports.VERSION_REGEX = new RegExp(['^', versionRegex, '$'].join(''));
module.exports.DEPRECATED_REGEX = new RegExp(['^\\[deprecated] ', versionRegex].join(''));
module.exports.REQUIRED_REGEX = new RegExp(['^\\[required] ', versionRegex].join(''));
