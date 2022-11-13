const { getWordCount } = require('../utils/text')

module.exports = function wordCount({ fileContent }) {
  return getWordCount(fileContent)
}