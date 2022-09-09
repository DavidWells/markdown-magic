const regexUtils = require('../utils/regex')
const remoteRequest = require('../utils/remoteRequest')

module.exports = function REMOTE(api) {
  // console.log('REMOTE api', api)
  const { options = {}, content, regex } = api
  const originalContent = content.value
  const remoteContent = remoteRequest(options.url)
  if (!remoteContent) {
    return originalContent
  }
  if (options.keepComments) {
    return remoteContent
  }
  // console.log('REMOTE', remoteContent)
  return remoteContent.replace(regex.open, '').replace(regex.close, '')
}
