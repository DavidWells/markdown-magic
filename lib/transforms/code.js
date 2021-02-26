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

  // handle option `lines`
  if (options.lines) {
    const startLine = options.lines.split('-')[0];
    const endLine = options.lines.split('-')[1];
    if ((startLine) && (endLine) && parseInt(startLine, 10) <= parseInt(endLine, 10)) {
      code = code.split(/\r\n|\n/).slice(startLine - 1, endLine).join('\n');
    }
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  code = code.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  let header = ''
  if (options.header) {
    header = `\n${options.header}`
  }

  return `<!-- The below code snippet is automatically added from ${options.src} -->
\`\`\`${syntax}${header}
${code}
\`\`\``
}
