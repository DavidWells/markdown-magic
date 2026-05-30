const REGEX_REGEX = /^\/((?:\\\/|[^\/])+)\/([imgy]*)$/

function escapeRegexString(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string')
  }
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d')
}

module.exports = {
  REGEX_REGEX,
  escapeRegexString,
}
