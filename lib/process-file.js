const path = require('path')
const isValidFile = require('is-valid-path')
const { readFile } = require('./utils/fs')
const { processContents } = require('./process-contents')
// const { OPEN_WORD, CLOSE_WORD } = require('./defaults')

async function processFile(opts = {}) {
  const { content, syntax } = opts
  let srcPath = opts.srcPath
  if (srcPath && content) {
    throw new Error(`Can't set both "srcPath" & "content"`) 
  }
  let fileContents
  if (content) {
    const isFile = isValidFile(content)
    srcPath = (isFile) ? content : undefined
    fileContents = (!isFile) ? content : undefined
  }

  if (!fileContents) {
    fileContents = await readFile(srcPath || content, 'utf8')
  }
  
  let syntaxType = syntax
  if (srcPath && !syntaxType) {
    syntaxType = path.extname(srcPath).replace(/^\./, '')
  }
  return processContents(fileContents, {
    ...opts,
    srcPath,
    syntax: syntaxType,
  })
}

module.exports = {
  processFile
}