const request = require('sync-request')
const regexUtils = require('../utils/regex')

module.exports = function REMOTE(content, options, config) {
  const remoteContent = remoteRequest(options.url)
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
    console.log(`URL NOT FOUND ${url}`)
    throw e
  }
  return body
}

module.exports.remoteRequest = remoteRequest
