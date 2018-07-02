"use strict" // eslint-disable-line

const path = require('path')
const fs = require('fs')
const isLocalPath = require('is-local-path')
const remoteRequest = require('../utils/remoteRequest')

module.exports = function CODE(content, options, config) {
  let code
  let syntax = options.syntax
  if (!options.src) {
    return false
  }
  if (isLocalPath(options.src)) {
    const fileDir = path.dirname(config.originalPath)
    const filePath = path.join(fileDir, options.src)
    try {
      code = fs.readFileSync(filePath, 'utf8', (err, contents) => {
        if (err) {
          console.log(`FILE NOT FOUND ${filePath}`)
          console.log(err)
           // throw err
        }
        return contents
      })
    } catch (e) {
      console.log(`FILE NOT FOUND ${filePath}`)
      throw e
    }
    if (!syntax) {
      syntax = path.extname(filePath).replace(/^./, '')
    }
  } else {
    // do remote request
    // console.log(options.src)
    const remoteContent = remoteRequest(options.src)
    if (!remoteContent) {
      console.log(`WARNING: ${options.src} URL NOT FOUND  or internet connection is off`)
      return content
    }
    code = remoteContent
    syntax = path.extname(options.src).replace(/^./, '')
  }

  // trim leading and trailing spaces/line breaks in code
  code = code.replace(/^\s+|\s+$/g, '')

  let header = ''
  if (options.header) {
    header = `\n${options.header}`
  }

  return `<!-- The below code snippet is automatically added from ${options.src} -->
\`\`\`${syntax}${header}
${code}
\`\`\``
}
