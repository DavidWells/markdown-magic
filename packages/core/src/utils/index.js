
/**
 * Filter function to get only unique values
 * @param {any} value - Current value
 * @param {number} index - Current index
 * @param {any[]} self - Original array
 * @returns {boolean} True if value is unique
 */
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

/**
 * Get code location string in format path:line:column
 * @param {string} srcPath - Source file path
 * @param {string|number} line - Line number
 * @param {string} [column='0'] - Column number
 * @returns {string} Location string
 */
function getCodeLocation(srcPath, line, column = '0') {
  return `${srcPath}:${line}:${column}`
}

/**
 * Pluralize word based on count
 * @param {any[]|number} thing - Array or number to count
 * @param {string} [single=''] - Singular form
 * @param {string} [plural=''] - Plural form
 * @returns {string} Singular or plural form
 */
function pluralize(thing, single = '', plural = '') {
  const count = Array.isArray(thing) ? thing.length : Number(thing)
  return count === 1 ? single : plural
}

module.exports = {
  pluralize,
  onlyUnique,
  getCodeLocation
}