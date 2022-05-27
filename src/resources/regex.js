const versionRegex = '\\d+\\.\\d+\\.\\d+';

export const VERSION_REGEX = new RegExp(['^', versionRegex, '$'].join(''));
export const DEPRECATED_REGEX = new RegExp(['^\\[deprecated] ', versionRegex].join(''));
export const REQUIRED_REGEX = new RegExp(['^\\[required] ', versionRegex].join(''));
