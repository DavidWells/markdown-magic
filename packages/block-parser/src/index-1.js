const { parse } = require('oparser')
const { getSyntaxInfo } = require('./syntax')
const { getTextBetweenChars, findMinIndent } = require('./text')
// Alt parser https://github.com/LesterLyu/fast-formula-parser/blob/master/grammar/lexing.js

// Performance optimizations: Pre-compiled regex patterns
const LEGACY_PARAM_REGEX = /^:|^\?/
const DASH_TRANSFORM_REGEX = /^(-[^\s]*)/
const BRACKET_STRIP_REGEX = /[(\[\{]*([A-Z-a-z0-9_$-]*)[)\]\}]*/

const SYNTAX = 'md'
const OPEN_WORD = 'doc-gen'
const CLOSE_WORD = 'end-doc-gen'

const defaultOptions = {
  syntax: SYNTAX,
  open: OPEN_WORD,
  close: CLOSE_WORD,
}

/**
 * @typedef {Object} BlockPosition
 * @property {string} value - The raw text value
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 */

/**
 * @typedef {Object} BlockContent
 * @property {string} value - The content between open and close tags
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {string} indentation - Minimum indentation of the content
 */

/**
 * @typedef {Object} BlockDetails
 * @property {string} indentation - Final indentation to use
 * @property {number[]} lines - Array of [startLine, endLine]
 * @property {number} start - Start position in the file
 * @property {number} end - End position in the file
 * @property {string} rawArgs - Raw arguments string
 * @property {string} rawContent - Raw content between tags
 * @property {string} value - The full block value
 */

/**
 * @typedef {Object} BlockContext
 * @property {boolean} isMultiline - Whether the block spans multiple lines
 * @property {boolean} [isLegacy] - Whether using legacy syntax
 */

/**
 * Details about the matched comment block
 * @typedef {Object} BlockData
 * @property {number} index - Block index in the file
 * @property {string} type - Transform type
 * @property {Object} options - Parsed options object
 * @property {BlockContext} context - Block context information
 * @property {BlockPosition} open - Open tag information
 * @property {BlockContent} content - Content information
 * @property {BlockPosition} close - Close tag information
 * @property {BlockDetails} block - Full block information
 */

/**
 * @typedef {Object} ParseBlocksResult
 * @property {RegExp} pattern - The regex pattern used
 * @property {RegExp} COMMENT_OPEN_REGEX - Regex for open comments
 * @property {RegExp} COMMENT_CLOSE_REGEX - Regex for close comments
 * @property {BlockData[]} blocks - Array of parsed blocks
 */

/**
 * Parse blocks from content string
 * @param {string} contents - The content string to parse
 * @param {Object} [opts={}] - Options object
 * @param {string} [opts.syntax=SYNTAX] - Comment syntax to use
 * @param {string} [opts.open=OPEN_WORD] - Open tag word
 * @param {string} [opts.close=CLOSE_WORD] - Close tag word
 * @returns {ParseBlocksResult} Result containing parsed blocks and patterns used
 */
function parseBlocks(contents, opts = {}) {
  const _options = Object.assign({}, defaultOptions, opts)
  const { syntax, open, close } = _options

  const patterns = getBlockRegex({
    syntax,
    openText: open,
    closeText: close
  })

  // console.log(patterns)

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
    const [ block, spaces, openTag, type, params = '', content, closeTag ] = newMatches
    
    let transformType = type
    paramString = params.trim()

    /* Account for dashes in transform name. E.g. funky-name-here */
    const dashInTransform = DASH_TRANSFORM_REGEX.exec(params)
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
    const indentation = spaces || ''
    // console.log('indentation', `"${indentation}"`)
    let context = {
      isMultiline,
    }
    // console.log('newMatches', newMatches)
    // This is necessary to avoid infinite loops
    if (newMatches.index === newerRegex.lastIndex) {
      newerRegex.lastIndex++
    }
    const openValue = indentation + openTag 
    const openStart = newMatches.index + indentation.length
    const openEnd = openStart + openTag.length


    const closeEnd = newerRegex.lastIndex
    // const finIndentation = (lineOpen === lineClose) ? '' : indentation

    const lineOpen = contents.substr(0, openStart).split('\n').length
    const lineClose = contents.substr(0, closeEnd).split('\n').length

    const contentStart = openStart + openTag.length // + indentation.length// - shift //+ indentation.length
    const contentEnd = contentStart + content.length // + finIndentation.length // + shift
    /* If single line comment block, remove indentation */
    const finIndentation = (lineOpen === lineClose) ? '' : indentation
    
    /* If old syntax XYZ?foo | XYZ:foo */
    if (LEGACY_PARAM_REGEX.test(paramString)) {
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

    const blockData = {
      index: blockIndex,
      type: transformType,
      options,
      context,
      /* Open Tag */
      open: {
        value: openValue,
        start: openStart,
        end: openEnd
      },
      /* Inner Content */
      content: {
        value: content,
        start: contentStart,
        end: contentEnd,
        indentation: findMinIndent(content),
      },
      /* Close Tag */
      close: {
        value: closeTag,
        start: contentEnd,
        end: closeEnd
      },
      /* Full Block */
      block: {
        indentation: finIndentation,
        lines: [lineOpen, lineClose],
        start: openStart,
        end: closeEnd,
        // position: [ commentMatches.index, regexToUse.lastIndex ],
        // rawType: (context.isLegacy) ? type.replace(/^\s?\(/, '') : type,
        rawArgs: paramString,
        rawContent: getTextBetweenChars(contents, contentStart, contentEnd),
        value: block,
      },
    }
    // console.log('blockData', blockData)
    newBlocks.push(blockData)
  }

  // console.log("NEW BLOCKS", newBlocks)
  // process.exit(1)
  return {
    // Close but no single line newPattern: newGetBlockRegex({ openComment, commentClose, start: START, ending: END }),
    // pattern: regexToUse,
    pattern: newerRegex,
    // COMMENT_OPEN_REGEX: openTagRegex,
    // COMMENT_CLOSE_REGEX: closeTagRegex,
    COMMENT_OPEN_REGEX: patterns.openPattern,
    COMMENT_CLOSE_REGEX: patterns.closePattern,
    blocks: newBlocks
  }
}

function verifyTagsBalanced(str, open, close) {
  // Performance optimization: Single pass counting using exec instead of match
  let openCount = 0
  let closeCount = 0
  let match
  
  // Reset regex lastIndex to ensure consistent behavior
  open.lastIndex = 0
  close.lastIndex = 0
  
  // Count open tags
  while ((match = open.exec(str)) !== null) {
    openCount++
    // Prevent infinite loops on zero-width matches
    if (match.index === open.lastIndex) {
      open.lastIndex++
    }
  }
  
  // Count close tags
  while ((match = close.exec(str)) !== null) {
    closeCount++
    // Prevent infinite loops on zero-width matches
    if (match.index === close.lastIndex) {
      close.lastIndex++
    }
  }
  
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
  // Performance optimization: Use pre-compiled regex
  return str.replace(BRACKET_STRIP_REGEX, '$1')
}

function legacyParseOptions(options) {
  const returnOptions = {}
  if (!options) {
    return returnOptions
  }
  // Performance optimization: Use for loop instead of map, avoid regex split
  const opts = options.split('&')
  for (let i = 0; i < opts.length; i++) {
    const equalIndex = opts[i].indexOf('=')
    if (equalIndex > 0) {
      const key = opts[i].substring(0, equalIndex)
      const value = opts[i].substring(equalIndex + 1)
      if (key && value) {
        returnOptions[key] = value
      }
    }
  }
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
  // const close = `(\\n?${openComment}(?:.*|\\r?|\\n?|\\s*)${closeText}(?:.|\\r?\\n)*?${closeComment})`
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

// function getOpeningTags(block, {
//   pattern, 
//   open,
//   close
// }) {
//   // console.log(block.match(/^\/\*+(.*)\*\//))
//   // console.log('openTagRegex', pattern)
//   let matches
//   while ((matches = pattern.exec(block)) !== null) {
//     if (matches.index === pattern.lastIndex) {
//       pattern.lastIndex++  // avoid infinite loops with zero-width matches
//     }
//     const [ tag, spaces, tagStart, tagEnd ] = matches
//     /*
//     console.log('FULL Open Tag >>>>>', tag)
//     console.log('openTag Start', "'"+tagStart+"'");
//     console.log('openTag End', "'"+tagEnd+"'");
//     /**/
//     return {
//       tag,
//       spaces: spaces || '',
//       length: tag.length,
//       tagStart,
//       tagEnd,
//     }
//   }
// }

// function getClosingTags(block, {
//   pattern, 
//   // open,
//   // close
// }) {
//   // console.log('closeTagRegex', closeTagRegex)
//   let matches
//   while ((matches = pattern.exec(block)) !== null) {
//     if (matches.index === pattern.lastIndex) {
//       pattern.lastIndex++ // avoid infinite loops with zero-width matches
//     }
//     const [ _tag, spaces, tagStart, tagEnd] = matches
//     /*
//     console.log('FULL CLOSE Tag >>>>>', matches[0])
//     console.log('closeTag Start', "'"+matches[1]+"'");
//     console.log('closeTag End', "'"+matches[2]+"'");
//     /**/
//     const tag = spaces + tagStart + tagEnd
//     return {
//       tag: tag,
//       length: tag.length,
//       spaces: spaces || '',
//       tagStart,
//       tagEnd
//     }
//   }
// }

// /**
//  * Get Regex pattern to match block
//  * @param {object} options
//  * @param {string} [options.openComment] - comment syntax open
//  * @param {string} [options.closeComment] - comment syntax open
//  * @param {string} [options.openText] - comment open text
//  * @param {string} [options.closeText] - comment close text
//  * @returns {RegExp}
//  */
// function getBlockRegexOld({ openComment, closeComment, openText, closeText }) {
//   // /([ \t]*)(<!-{2,}(?:.|\r?|\n?|\s*)\bdoc-gen\b)((?:.|\r?\n)*?)-{2,}>(.*)<!-{2,}(?:.*|\r?|\n?|\s*)end-doc-gen(?:.|\r?\n)*?-{2,}>/i singleline
//   return new RegExp(
//     `([ \\t]*)(?:${openComment}(?:.*|\\r?|\\n?|\\s*)${openText}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.*?|.*?\\r?\\n?)*?)${openComment}(?:.*|\\r?|\\n?|\\s*)${closeText}(?:.|\\r?\\n)*?${closeComment}`,
//     'gmi'
//   )
// }


// function newGetBlockRegex({ commentOpen, commentClose, start, ending }) {
//   // https://regex101.com/r/C9WSk8/1 close but breaks on single line blocks. Maybe needs lookahead https://stackoverflow.com/questions/7124778/how-can-i-match-anything-up-until-this-sequence-of-characters-in-a-regular-exp
//   return new RegExp(
//     `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${start}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)([\\s\\S]*?)${commentClose}((?:.*?|.*?\\r?\\n?)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${ending}(?:.|\\r?\\n)*?${commentClose}`,
//     'gmi'
//   )
// }

// function getOpenCommentRegex(word, open, close) {
//   // console.log('open', open)
//   const boundary = word.indexOf('/') > -1 ? '' : '\\b'
//   // console.log('boundary', boundary)
//   // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
//   return new RegExp(`([ \\t]*)(${open}(?:.|\r?|\n?|\\s*)${boundary}${word}${boundary})((?:.|\\r?\\n)*?${close}\n?)`, 'gi')
// }

// function getClosingCommentRegex(word, open, close) {
//   const boundary = word.indexOf('/') > -1 ? '' : '\\b'
//   return new RegExp(`${close}(?:.|\\r?\\n)*?([ \t]*)((?:${open}(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${boundary}${word}${boundary})((?:.|\\r?\\n)*?${close})`, 'gi')
//   // return new RegExp(`--\\>(?:.|\\r?\\n)*?([ \t]*)((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${word}:END)((?:.|\\r?\\n)*?--\\>)`, 'gi')
// }

module.exports = {
  getBlockRegex,
  parseBlocks,
}