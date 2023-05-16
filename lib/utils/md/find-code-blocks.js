const { getLineCount, getLineNumberFromMatch } = require('./utils')

// https://regex101.com/r/nIlW1U/6
const CODE_BLOCK_REGEX = /^([A-Za-z \t]*)```([A-Za-z]*)?\n([\s\S]*?)```([A-Za-z \t]*)*$/gm
// https://regex101.com/r/oPKKoC/1
const REMOVE_CODE_BLOCK_REGEX = /^(?:[A-Za-z \t]*)?(```(?:[A-Za-z]*)?\n(?:[\s\S]*?)```)([A-Za-z \t]*)*$/gm

/**
 * Parse code blocks out of markdown
 * @param {string} block 
 * @param {Object} opts 
 * @returns {Object}
 * @example
 * const { blocks, errors } = findCodeBlocks(content)
 * console.log('blocks', blocks)
 * console.log('errors', errors)
 */
function findCodeBlocks(block, opts = {}) {
  const { filePath = '', includePositions } = opts
  let matches
  let errors = []
  let blocks = []
  const msg = (filePath) ? ` in ${filePath}` : ''
  while ((matches = CODE_BLOCK_REGEX.exec(block)) !== null) {
    if (matches.index === CODE_BLOCK_REGEX.lastIndex) {
      CODE_BLOCK_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, prefix, syntax, content, postFix ] = matches
    const lineNumber = getLineNumberFromMatch(block, matches)
    let hasError = false
    /* // debug
    console.log(`prefix: "${prefix}"`)
    console.log(`postFix: "${postFix}"`)
    console.log('syntax:', lang)
    console.log('Content:')
    console.log(content.trim())
    console.log('───────────────────────')
    /** */
    const codeBlock = {}
    if (includePositions) {
      codeBlock.line = lineNumber
      codeBlock.index = matches.index
    }

    if (syntax) {
      codeBlock.syntax = syntax
    }
    
    codeBlock.block = match

    /* Validate code blocks */
    if (prefix && prefix.match(/\S/)) {
      hasError = true
      errors.push({
        line: lineNumber,
        index: matches.index,
        message: `Prefix "${prefix}" not allowed on line ${lineNumber}. Fix the code block${msg}.`,
        block: match
      })
    }
    if (postFix && postFix.match(/\S/)) {
      hasError = true
      const line = lineNumber + (getLineCount(match) - 1)
      errors.push({
        line,
        index: matches.index + match.length,
        message: `Postfix "${postFix}" not allowed on line ${line}. Fix the code block${msg}.`,
        block: match
      })
    }

    if (!hasError) {
      codeBlock.code = content.trim()
      blocks.push(codeBlock)
    }
  }

  return {
    errors,
    blocks
  }
}

module.exports = {
  findCodeBlocks,
  CODE_BLOCK_REGEX,
  REMOVE_CODE_BLOCK_REGEX
}