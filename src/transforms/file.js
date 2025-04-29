const path = require('path')
const fs = require('fs')
const isLocalPath = require('is-local-path')
const { formatMd } = require('../utils/format-md')

module.exports = function FILE(api) {
  /*
  console.log('FILE API', api)
  /** */
  const { options, srcPath } = api
  if (!options.src) {
    return false
  }
  let fileContents = ''
  if (isLocalPath(options.src)) {
    const fileDir = path.dirname(srcPath)
    const resolvedFilePath = path.resolve(fileDir, options.src)
    try {
      // console.log('READFILE', resolvedFilePath)
      fileContents = fs.readFileSync(resolvedFilePath, 'utf8')
    } catch (e) {
      // if demo path. Todo probably remove
      if (options.src === './path/to/file') {
        return api.content
      }
      console.log(`FILE NOT FOUND ${resolvedFilePath}`)
      throw e
    }
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  fileContents = fileContents.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  const ext = path.extname(options.src).toLowerCase()
  const isMarkdown = ext === '.md' || ext === '.markdown' || ext === '.mdown' || ext === '.mdx'
  
  if (isMarkdown) {
    fileContents = formatMd(fileContents, options)
  }

  if (options.textBefore) {
    fileContents = `${options.textBefore}${fileContents}`
  }

  if (options.textAfter) {
    fileContents = `${fileContents}${options.textAfter}`
  }

  return fileContents

  return `<!-- The below content is automatically added from ${options.src} -->
${fileContents}`
}

// maybe support...
function legacyCODE(content, options, config) {

}