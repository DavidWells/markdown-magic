const { remoteRequest } = require('../utils/remoteRequest')

module.exports = async function REMOTE(api) {
  // console.log('REMOTE api', api)
  const { options, content, settings } = api
  const { regex } = settings
  // console.log('MAKE REMOTE REQUEST')
  const remoteContent = await remoteRequest(options.url, settings, api.srcPath)
  if (!remoteContent) {
    return content
  }
  if (options.keepComments) {
    return remoteContent
  }
  // console.log('REMOTE', remoteContent)
  return remoteContent.replace(regex.open, '').replace(regex.close, '')
}
