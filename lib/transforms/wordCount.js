const { getWordCount } = require('../utils/text')

module.exports = function wordCount({ currentFileContent }) {
  return getWordCount(currentFileContent)
}