const regexUtils = require('../utils/regex')
const remoteRequest = require('../utils/remoteRequest')

module.exports = function REMOTE(api) {
  // console.log('REMOTE api', api)
  const { options, blockContent, settings } = api
  const { regex } = settings
  // console.log('MAKE REMOTE REQUEST')
  const remoteContent = remoteRequest(options.url)
  if (!remoteContent) {
    return blockContent
  }
  if (options.keepComments) {
    return remoteContent
  }
  // console.log('REMOTE', remoteContent)
  return remoteContent.replace(regex.open, '').replace(regex.close, '')
}
