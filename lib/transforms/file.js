const path = require('path')
const fs = require('fs')
const isLocalPath = require('is-local-path')

module.exports = function FILE(api) {
  // console.log('FILE API', api)
  const { options, filePath } = api
  let fileContents
  let syntax = options.syntax
  if (!options.src) {
    return false
  }
  if (isLocalPath(options.src)) {
    const fileDir = path.dirname(filePath)
    const resolvedFilePath = path.resolve(fileDir, options.src)
    try {
      fileContents = fs.readFileSync(resolvedFilePath, 'utf8', (err, contents) => {
        if (err) {
          console.log(`FILE NOT FOUND ${resolvedFilePath}`)
          console.log(err)
           // throw err
        }
        return contents
      })
    } catch (e) {
      console.log(`FILE NOT FOUND ${resolvedFilePath}`)
      throw e
    }
    if (!syntax) {
      syntax = path.extname(resolvedFilePath).replace(/^./, '')
    }
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  fileContents = fileContents.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  return `<!-- The below content is automatically added from ${options.src} -->
${fileContents}`
}
