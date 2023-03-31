const path = require('path')
const fs = require('fs')
const isLocalPath = require('is-local-path')

module.exports = function FILE(api) {
  /*
  console.log('FILE API', api)
  console.log(api.getBlockDetails())
  process.exit(1)
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
      fileContents = fs.readFileSync(resolvedFilePath, 'utf8')
    } catch (e) {
      console.log(`FILE NOT FOUND ${resolvedFilePath}`)
      throw e
    }
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  fileContents = fileContents.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  return `<!-- The below content is automatically added from ${options.src} -->
${fileContents}`
}

// maybe support...
function legacyCODE(content, options, config) {

}