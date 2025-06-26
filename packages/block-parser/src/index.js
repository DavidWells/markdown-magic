const { parse } = require('oparser')
const { getSyntaxInfo } = require('./syntax')
const { getTextBetweenChars, findMinIndent, dedentString } = require('./text')
// Alt parser https://github.com/LesterLyu/fast-formula-parser/blob/master/grammar/lexing.js

const SYNTAX = 'md'
const OPEN_WORD = 'doc-gen'
const CLOSE_WORD = 'end-doc-gen'

const LEADING_INDENT_REGEX = /^[\r\n]*(\s*)/

const defaultOptions = {
  syntax: SYNTAX,
  open: OPEN_WORD,
  close: CLOSE_WORD,
}



/**
 * Details about the open tag
 * @typedef {Object} OpenBlock
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {string} match - The matched open tag text
 * @property {string} value - The open tag value
 * @property {number} indent - Leading indent of the open tag
 */

/**
 * @typedef {Object} InnerContent
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {number} indent - Minimum indent of the content
 * @property {string} match - The matched content text
 * @property {string} value - The dedented content value
 */

/**
 * Details about the close tag
 * @typedef {Object} CloseBlock
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {string} match - The matched close tag text
 * @property {string} value - The close tag value
 * @property {number} indent - Leading indent of the close tag
 */

/**
 * @typedef {Object} BlockDetails
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {number} indent - Final indent to use
 * @property {string} match - The matched full block text
 * @property {string} value - The dedented full block value
 */

/**
 * @typedef {Object} Context
 * @property {boolean} isMultiline - Whether the block spans multiple lines
 * @property {boolean} [isLegacy] - Whether using legacy syntax
 */

/**
 * Details about the matched comment block
 * @typedef {Object} BlockData
 * @property {string} type - Transform type
 * @property {number} index - Block index in the file
 * @property {number[]} lines - Array of exactly 2 numbers: [startLine, endLine]
 * @property {number[]} position - Array of exactly 2 numbers: [startPosition, endPosition]
 * @property {Record<string, string|number|boolean|Object>} options - Parsed options object
 * @property {string} optionsStr - Raw options string
 * @property {Context} context - Block context information
 * @property {OpenBlock} open - Open tag information
 * @property {InnerContent} content - Content information
 * @property {CloseBlock} close - Close tag information
 * @property {BlockDetails} block - Full block information
 */

/**
 * @typedef {Object} ParseBlocksResult
 * @property {RegExp} pattern - The regex pattern used
 * @property {RegExp} openPattern - Regex for open comments
 * @property {RegExp} closePattern - Regex for close comments
 * @property {BlockData[]} blocks - Array of parsed blocks
 */

/**
 * Custom regex patterns for open and close tags
 * @typedef {Object} CustomPatterns
 * @property {RegExp} [openPattern] - Custom regex pattern for open tags
 * @property {RegExp} [closePattern] - Custom regex pattern for close tags
 * @property {RegExp} [blockPattern] - Custom regex pattern for block tags
 */

/**
 * Parse blocks from content string
 * @param {string} contents - The content string to parse
 * @param {Object} [opts={}] - Options object
 * @param {string} [opts.syntax=SYNTAX] - Comment syntax to use
 * @param {string} [opts.open=OPEN_WORD] - Open tag word
 * @param {string} [opts.close=CLOSE_WORD] - Close tag word
 * @param {CustomPatterns} [opts.customPatterns] - Custom regex patterns for open and close tags
 * @returns {ParseBlocksResult} Result containing parsed blocks and patterns used
 */
function parseBlocks(contents, opts = {}) {
  const _options = Object.assign({}, defaultOptions, opts)
  const { syntax, open, close, customPatterns } = _options

  let patterns = {}
  let hasCustomPatterns = false
  if (customPatterns && typeof customPatterns === 'object') {
    const { openPattern, closePattern } = customPatterns
    if (openPattern instanceof RegExp && closePattern instanceof RegExp) {
      // Ensure global flag is present
      patterns.openPattern = openPattern.flags && openPattern.flags.indexOf('g') > -1 ? openPattern : new RegExp(openPattern.source, 'g')
      patterns.closePattern = closePattern.flags && closePattern.flags.indexOf('g') > -1 ? closePattern : new RegExp(closePattern.source, 'g')
      if (!patterns.blockPattern) {
        patterns.blockPattern = new RegExp(`${openPattern.source}([\\s\\S]*?)${closePattern.source}`, 'g')
      }
      hasCustomPatterns = true
    }
  } else {
    /* default patterns */
    patterns = getBlockRegex({
      syntax,
      openText: open,
      closeText: close
    })
  }

  // console.log('patterns', patterns)

  const newerRegex = patterns.blockPattern
  /*
  console.log('newerRegex', newerRegex)
  console.log('open', patterns.openPattern)
  console.log('close', patterns.closePattern)
  /** */

  /*
  const regexToUse = getBlockRegex({
    openComment,
    closeComment,
    openText: open,
    closeText: close
  })
  console.log('regexToUse', regexToUse)
  */

  // let openTagRegex = getOpenCommentRegex(open, openComment, closeComment)
  // let closeTagRegex = getClosingCommentRegex(close, openComment, closeComment)
  // console.log('openTagRegex', openTagRegex)
  // console.log('patterns.openPattern',  patterns.openPattern)
  // console.log('closeTagRegex', closeTagRegex)
  // console.log('patterns.closePattern',  patterns.closePattern)

  /* Verify comment blocks aren't broken (redos) */
  const { isBalanced, openCount, closeCount } = verifyTagsBalanced(
    contents, 
    patterns.openPattern, 
    patterns.closePattern
  )
  /*
  console.log('isBalanced', isBalanced)
  /** */

  const balanced = (closeCount > openCount) ? true : isBalanced
  if (!balanced) {
    throw new Error(`[Parsing error]

Comment blocks are unbalanced in string

Details:
  - Found ${openCount} "${open}" open tags.
  - Found ${closeCount} "${close}" close tags.\n\n`)
  }

  /* New regex works! */
  const newBlocks = []
  let blockIndex = 0
  let newMatches
  while ((newMatches = newerRegex.exec(contents)) !== null) {
    blockIndex++
    let paramString = ''
    let options = {}
    
    if (hasCustomPatterns && newMatches.length < 4) {
      let block = ''
      let innerText = ''
      let transformType = 'unknown'
      let options = {}
      if (newMatches.length === 2) {
        [ block, innerText ] = newMatches
      } else if (newMatches.length === 3) {
        [ block, options, innerText ] = newMatches
      } else if (newMatches.length === 4) {
        [ block, transformType, options, innerText ] = newMatches
      }
      const openMatch = block.match(patterns.openPattern)
      const closeMatch = block.match(patterns.closePattern)
      newBlocks.push({
        type: transformType,
        index: blockIndex,
        lines: [1, 1],
        position: [0, 0],
        options,
        optionsStr: '',
        context: {
          isMultiline: innerText.indexOf('\n') > -1,
        },
        open: {
          start: 0,
          end: 0,
          match: openMatch ? openMatch[0] : '',
          value: openMatch ? openMatch[0] : '',
          indent: 0,
        },
        content: {
          start: 0,
          end: 0,
          indent: 0,
          match: innerText,
          value: innerText,
        },
        close: {
          start: 0,
          end: 0,
          match: closeMatch ? closeMatch[0] : '',
          value: closeMatch ? closeMatch[0] : '',
          indent: 0,
        },
        block: {
          start: 0,
          end: 0,
          indent: 0,
          match: block,
          value: block,
        },
      })
      continue
    }

    const [ block, spaces, openTag, type, params = '', content, closeTag ] = newMatches
    
    let transformType = type
    paramString = params.trim()

    /* Account for dashes in transform name. E.g. funky-name-here */
    const dashInTransform = params.match(/^(-[^\s]*)/)
    if (dashInTransform && dashInTransform[1]) {
      transformType = type + dashInTransform[1]
      paramString = paramString.replace(dashInTransform[1], '')
    }
    /*
    console.log('index', newMatches.index)
    console.log('block', block)
    console.log('type', type)
    console.log('params', params)
    console.log('spaces', `"${spaces}"`)
    /** */
    const isMultiline = block.indexOf('\n') > -1
    const indent = spaces || ''
    // console.log('indent', `"${indent}"`)

    // console.log('newMatches', newMatches)
    // This is necessary to avoid infinite loops
    if (newMatches.index === newerRegex.lastIndex) {
      newerRegex.lastIndex++
    }
    const openValue = indent + openTag 
    const openStart = newMatches.index + indent.length
    const openEnd = openStart + openTag.length

    const closeEnd = newerRegex.lastIndex
    // const finIndentation = (lineOpen === lineClose) ? '' : indent

    const lineOpen = contents.substr(0, openStart).split('\n').length
    const lineClose = contents.substr(0, closeEnd).split('\n').length

    const contentStart = openStart + openTag.length // + indent.length// - shift //+ indent.length
    const contentEnd = contentStart + content.length // + finIndentation.length // + shift
    /* If single line comment block, remove indent */
    const finIndentation = (lineOpen === lineClose) ? 0 : indent.length
    
    let context = {
      isMultiline,
    }
    /* If old syntax XYZ?foo | XYZ:foo */
    if (paramString.match(/^:|^\?/)) {
      paramString = paramString.split(')')[0]
      paramString = paramString.replace(/^:/, '').replace(/^\?/, '').replace(/\)$/g, '')
      // console.log('paramString', `"${paramString}"`)
      options = legacyParseOptions(paramString)
      context.isLegacy = true
    } else {
      if (paramString[0] === '(' && paramString[paramString.length - 1] === ')') {
        paramString = paramString.replace(/^\(/, '').replace(/\)$/g, '')
      }
      options = parse(paramString)
    }

    // console.log('open start', openStart)
    // console.log('openEnd', openEnd)
    // console.log('options', options)

    // context.hasNoBlankLine = content.indexOf('\n') === -1

    const rawContent = getTextBetweenChars(contents, contentStart, contentEnd)
    const dedentResult = dedentString(rawContent, { preserveEmptyLines: false })
    const blockDedentResult = dedentString(block, { preserveEmptyLines: false })
    // console.log('minIndent', minIndent)
    // console.log('other', findMinIndent(content))

    const blockData = {
      type: transformType,
      index: blockIndex,
      lines: [lineOpen, lineClose],
      position: [ openStart, closeEnd ],
      options,
      optionsStr: paramString,
      /* details about the block */
      context,
      /* Open Tag */
      open: {
        start: openStart,
        end: openEnd,
        match: openValue,
        value: openTag,
        indent: (!context.isMultiline) ? 0 : findLeadingIndent(openValue),
      },
      /* Inner Content */
      content: {
        start: contentStart,
        end: contentEnd,
        indent: dedentResult.minIndent,
        match: content,
        value: dedentResult.text,
      },
      /* Close Tag */
      close: {
        start: contentEnd,
        end: closeEnd,
        match: closeTag,
        value: closeTag,
        indent: (!context.isMultiline) ? 0 : findLeadingIndent(closeTag),
      },
      /* Full Block */
      block: {
        start: openStart,
        end: closeEnd,
        indent: blockDedentResult.minIndent,
        // position: [ newMatches.index, newerRegex.lastIndex ],
        // rawType: (context.isLegacy) ? type.replace(/^\s?\(/, '') : type,
        match: block,
        value: blockDedentResult.text,
      },
    }
    // console.log('blockData', blockData)
    newBlocks.push(blockData)
  }

  return {
    // Close but no single line newPattern: newGetBlockRegex({ openComment, commentClose, start: START, ending: END }),
    // pattern: regexToUse,
    pattern: newerRegex,
    // openPattern: openTagRegex,
    // closePattern: closeTagRegex,
    openPattern: patterns.openPattern,
    closePattern: patterns.closePattern,
    blocks: newBlocks
  }
}

function findLeadingIndent(str) {
  return (str.match(LEADING_INDENT_REGEX) || [])[1]?.length || 0
}

function verifyTagsBalanced(str, open, close) {
  const openCount = (str.match(open) || []).length
  // console.log('openCount', openCount)
  const closeCount = (str.match(close) || []).length
  // console.log('closeCount', closeCount)
  return {
    isBalanced: openCount === closeCount,
    openCount,
    closeCount
  }
}

/**
 * Strip brackets from string (functionName) or [functionName] or {functionName}
 * @param {string} str 
 * @returns {string}
 */
function stripBrackets(str) {
  return str.replace(/[(\[\{]*([A-Z-a-z0-9_$-]*)[)\]\}]*/, '$1')
}

function legacyParseOptions(options) {
  const returnOptions = {}
  if (!options) {
    return returnOptions
  }
  options.split('&').map((opt, i) => { // eslint-disable-line
    const getValues = opt.split(/=(.+)/)
    if (getValues[0] && getValues[1]) {
      returnOptions[getValues[0]] = getValues[1]
    }
  })
  return returnOptions
}


/* TODO someday Named matches
(?<leading>[ \t]*)(?:<!-{2,}(?:.*|\r?|\n?|\s*)MD-MAGIC-EXAMPLE:START\s*(?<key>[(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)([\s\S]*?)-->(?<content>(?:.*?|.*?\r?\n?)*?)<!-{2,}(?:.*|\r?|\n?|\s*)MD-MAGIC-EXAMPLE:END(?:.|\r?\n)*?-{2,}>
*/

/**
 * Block matching patterns
 * @typedef {{blockPattern: RegExp, openPattern: RegExp, closePattern: RegExp}} RegexPatterns
 */

/**
 * Get Regex pattern to match block
 * @param {object} options
 * @param {string} [options.syntax] - comment open text
 * @param {string} [options.openText] - comment open text
 * @param {string} [options.openEmoji] - emoji
 * @param {string} [options.closeText] - comment close text
 * @param {boolean} [options.allowMissingTransforms] - Allow for missing transform key
 * @returns {RegexPatterns}
 */
function getBlockRegex({
  openEmoji,
  syntax = SYNTAX,
  openText = '', 
  closeText = '',
  allowMissingTransforms = false
}) {
  if (!openText) {
    throw new Error('Missing options.open')
  }
  if (!closeText) {
    throw new Error('Missing options.close')
  }
  if (!syntax) {
    throw new Error('Missing options.syntax')
  }

  const syntaxInfo = getSyntaxInfo(syntax)
  if (!syntaxInfo.pattern) {
    throw new Error(`Unknown syntax "${syntax}"`)
  }

  const [ openComment, closeComment ] = syntaxInfo.pattern
  // https://regex101.com/r/SU2g1Q/1
  // https://regex101.com/r/SU2g1Q/2
  // https://regex101.com/r/SU2g1Q/3
  // https://regex101.com/r/SU2g1Q/4
  // https://regex101.com/r/SU2g1Q/5
  // https://regex101.com/r/SU2g1Q/6
  // /([ \t]*)(<!-{2,}(?:.|\r?|\n?|\s*)\bdoc-gen\b)((?:.|\r?\n)*?)-{2,}>([\s\S]*?.*)\n?<!-{2,}(?:.*|\r?|\n?|\s*)end-doc-gen(?:.|\r?\n)*?-{2,}>/gim
  // /([ \t]*)(<!-{2,}(?:\r?|\n?|\s*)\bdoc-gen\b)\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*((?:.|\r?\n)*?)-{2,}>([\s\S]*?.*)\n?<!-{2,}(?:.*|\r?|\n?|\s*)end-doc-gen(?:.|\r?\n)*?-{2,}>/
  const emojiPat = (openEmoji) ? `(?:\\s*${openEmoji})?` : '(?:\\s*⛔️)?'
  const boundary = openText.indexOf('/') > -1 ? '' : '\\b'
  const matchWord = `${boundary}${openText}${boundary}`
  const hasOne = (allowMissingTransforms) ? '*' : '+'
  const open = `((?:${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)${matchWord})\\s*[(\\[\\{]*([A-Za-z0-9_$]${hasOne})[)\\]\\}]*\\s*((?:.|\\r?\\n)*?)${closeComment}\\n?)`
  // const close = `(\\n?[ \\t]?${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)${closeText}(?:.|\\r?\\n)*?${closeComment})`
  const close = `(\\n?[ \\t]*${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)${closeText}(?:.|\\r?\\n)*?${closeComment})`
  const blockPattern = new RegExp(`([ \\t]*)${open}([\\s\\S]*?)${close}`, 'gmi')
  // 👇 repeat error with .* on weird contents
  // const blockPattern = new RegExp(`([ \\t]*)${open}([\\s\\S]*?.*)${close}`, 'gmi')
  const openPattern = new RegExp(open, 'gi')
  const closePattern = new RegExp(close, 'gi')

  return {
    blockPattern,
    openPattern,
    closePattern
  }
}

module.exports = {
  getBlockRegex,
  parseBlocks,
}