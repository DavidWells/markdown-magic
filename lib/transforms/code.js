const fs = require('fs')
const path = require('path')
const remoteRequest = require('../utils/remoteRequest')
const { isLocalPath } = require('../utils/fs')
const { deepLog } = require('../utils/logs')
const { getLineCount, getTextBetweenLines } = require('../utils/text')

/**
 * Options for specifying source code to include in documentation.
 * @typedef {Object} CodeTransformOptions
 * @property {string} src - The relative path to the code to include, or the URL where the raw code lives.
 * @property {string} [syntax] - The syntax of the code. If not specified, it will be inferred by fileType.
 * @property {string} [header] - The header comment to add to the code snippet. Useful for pointing to relative source directory or adding live doc links.
 * @property {string} [lines] - A range of lines of code to include from the file. The line range should be defined like "lines=22-44".
 * @example
   ```md
   <!-- doc-gen CODE src="./relative/path/to/code.js" -->
   This content will be dynamically replaced with code from the file
   <!-- end-doc-gen -->
   ```
  
   ```md
   <!-- doc-gen CODE src="./relative/path/to/code.js" lines="22-44" -->
   This content will be dynamically replaced with code from the file lines 22 through 44
   <!-- end-doc-gen -->
   ```
 */

// TODO code sections 
// https://github.com/linear/linear/blob/94af540244864fbe466fb933256278e04e87513e/docs/transforms/code-section.js
// https://github.com/linear/linear/blob/bc39d23af232f9fdbe7df458b0aaa9554ca83c57/packages/sdk/src/_tests/readme.test.ts#L133-L140
// usage https://github.com/linear/linear/blame/93981d3a3db571e2f8efdce9f5271ea678941c43/packages/sdk/README.md#L1

module.exports = function CODE(api) {
  const { content, srcPath } = api
  /** @type {CodeTransformOptions} */
  const options = api.options || {}
  // console.log('CODE API', api)
  // process.exit(1)
  // console.log('options', options)
  const { src, lines, id } = options
  const originalContent = content
  let code
  let syntax = options.syntax
  if (!src) {
    deepLog(api.getCurrentBlock())
    throw new Error('Missing "src" attribute')
  }
  let codeFilePath = src
  if (isLocalPath(src)) {
    const fileDir = (srcPath) ? path.dirname(srcPath) : process.cwd()
    codeFilePath = path.resolve(fileDir, src)
    try {
      // console.log('READFILE CODE', codeFilePath)
      code = fs.readFileSync(codeFilePath, 'utf8')
    } catch (e) {
      console.log(`FILE NOT FOUND ${codeFilePath}`)
      throw e
    }
    if (!syntax) {
      syntax = path.extname(codeFilePath).replace(/^./, '')
    }
  } else {
    // do remote request
    // console.log(src)
    const remoteContent = remoteRequest(src)
    if (!remoteContent) {
      console.log(`WARNING: ${src} URL NOT FOUND  or internet connection is off`)
      return originalContent
    }
    code = remoteContent
    syntax = path.extname(src).replace(/^./, '')
  }

  /* handle option `lines` */
  if (options.lines) {
    const lineCount = getLineCount(code)
    // console.log('lineCount', lineCount)
    // console.log('src', src)
    // console.log('lines', lines)
    let startLine
    let endLine
    if (Array.isArray(lines)) {
      startLine = lines[0]
      endLine = lines[1]
    } else if (typeof lines === 'string') {
      const splitLines = lines.split('-')
      startLine = splitLines[0]
      endLine = splitLines[1]
    }
    if ((startLine) && (endLine) && parseInt(startLine, 10) <= parseInt(endLine, 10)) {
      code = getTextBetweenLines(code, startLine, endLine)
    }
  }

  /* Check for Id */
  if (id) {
    const lines = code.split("\n")
    const startLineIndex = lines.findIndex(line => line.includes(`CODE_SECTION:${id}:START`));
    const startLine = startLineIndex !== -1 ? startLineIndex : 0;

    const endLineIndex = lines.findIndex(line => line.includes(`CODE_SECTION:${id}:END`));
    const endLine = endLineIndex !== -1 ? endLineIndex : lines.length - 1;
    // console.log('startLine', startLine)
    // console.log('endLineendLine', endLine)
    if (startLine === -1 && endLine === -1) {
      throw new Error(`Missing ${id} code section from ${codeFilePath}`)
    }
  
    const selectedLines = lines.slice(startLine + 1, endLine)
  
    const trimBy = selectedLines[0]?.match(/^(\s*)/)?.[1]?.length
    const newValue = `${selectedLines.map(line => line.substring(trimBy).replace(/^\/\/ CODE_SECTION:INCLUDE /g, "")).join("\n")}`
    // console.log('newValue', newValue)
    code = newValue
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  code = code.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  let header = ''
  if (options.header) {
    header = `\n${options.header}`
  }

  return `\`\`\`${syntax}${header}
${code}
\`\`\``
}
