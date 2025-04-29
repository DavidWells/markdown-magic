const path = require('path')
const { remoteRequest } = require('../utils/remoteRequest')
const { formatMd } = require('../utils/format-md')

module.exports = async function REMOTE(api) {
  // console.log('REMOTE api', api)
  const { options, content, settings } = api
  const { regex } = settings
  const remoteUrl = options.url || options.src || options.URL || options.Url

  // console.log('MAKE REMOTE REQUEST')
  let remoteContent = await remoteRequest(remoteUrl, settings, api.srcPath)
  if (!remoteContent) {
    return content
  }

  const ext = path.extname(remoteUrl).toLowerCase()
  const isMarkdown = ext === '.md' || ext === '.markdown' || ext === '.mdown' || ext === '.mdx'
  
  if (isMarkdown) {
    remoteContent = formatMd(remoteContent, options)
  }

  if (options.keepComments) {
    return remoteContent
  }
  
  // console.log('REMOTE', remoteContent)
  return remoteContent.replace(regex.open, '').replace(regex.close, '')
}
