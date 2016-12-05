const request = require('sync-request')
const regexUtils = require('../utils/regex')

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

function remoteRequest(url) {
  let body
  try {
    const res = request('GET', url)
    body = res.getBody('utf8')
  } catch (e) {
    console.log(`WARNING: REMOTE URL ${url} NOT FOUND`) // eslint-disable-line
    console.log(e.message) // eslint-disable-line
  }
  return body
}

module.exports.remoteRequest = remoteRequest
