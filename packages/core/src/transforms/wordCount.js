const { getWordCount } = require('../utils/text')

module.exports = function wordCount(api) {
  const { currentContent } = api
  return getWordCount(currentContent)
}