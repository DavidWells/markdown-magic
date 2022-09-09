const { getWordCount } = require('../utils/text')

module.exports = function wordCount({ currentContents }) {
  return getWordCount(currentContents)
}