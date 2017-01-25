"use strict" // eslint-disable-line
const regexUtils = require('../utils/regex')
const remoteRequest = require('../utils/remoteRequest')

module.exports = function REMOTE(content, options, config) {
  const remoteContent = remoteRequest(options.url) || content
  if (!remoteContent) {
    return content
  }
  if (options.keepComments) {
    return remoteContent
  }
  const openTagRegex = regexUtils.matchOpeningCommentTag(config.matchWord)
  const closeTagRegex = regexUtils.matchClosingCommentTag(config.matchWord)
  return remoteContent.replace(openTagRegex, '').replace(closeTagRegex, '')
}
