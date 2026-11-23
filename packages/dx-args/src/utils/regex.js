const REGEX_REGEX = /^\/((?:\\\/|[^\/])+)\/([imgy]*)$/

function escapeRegexString(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string')
  }
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d')
}

/* A real number such as -5, -5.5, -.5 or -1e3. `-2fa` is an option, not a number. */
const IS_NEGATIVE_NUMBER = /^-(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

module.exports = {
  IS_NEGATIVE_NUMBER,
  REGEX_REGEX,
  escapeRegexString,
}
