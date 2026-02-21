const { parse } = require('oparser')
const { getSyntaxInfo } = require('./syntax')
const { getTextBetweenChars, findMinIndent, dedentString } = require('./text')
// Alt parser https://github.com/LesterLyu/fast-formula-parser/blob/master/grammar/lexing.js

const SYNTAX = 'md'
const OPEN_WORD = 'block'
const CLOSE_WORD = '/block'

const LEADING_INDENT_REGEX = /^[\r\n]*(\s*)/
const REGEX_PATTERN_CHARS = /[|[\]*+?()\\]/
const REGEX_LITERAL = /^\/((?:\\\/|[^\/])+)\/([gimsuy]*)$/

/**
 * Check if value is a RegExp object
 * @param {any} value
 * @returns {boolean}
 */
function isRegExp(value) {
  return value instanceof RegExp
}

/**
 * Check if string is a regex literal like /pattern/flags
 * @param {string} str
 * @returns {boolean}
 */
function isRegexLiteral(str) {
  if (!str || typeof str !== 'string') return false
  return REGEX_LITERAL.test(str)
}

/**
 * Parse a regex literal string into { source, flags }
 * @param {string} str - Regex literal like '/pattern/gi'
 * @returns {{ source: string, flags: string } | null}
 */
function parseRegexLiteral(str) {
  if (!str || typeof str !== 'string') return null
  const match = str.match(REGEX_LITERAL)
  if (!match) return null
  return { source: match[1], flags: match[2] || '' }
}

/**
 * Get the regex source from a value (RegExp, regex literal string, or plain string)
 * @param {RegExp|string} value
 * @returns {{ source: string, flags: string, isRegex: boolean }}
 */
function getRegexSource(value) {
  if (isRegExp(value)) {
    const re = /** @type {RegExp} */ (value)
    return {
      source: re.source,
      flags: re.flags,
      isRegex: true
    }
  }
  if (typeof value === 'string') {
    const parsed = parseRegexLiteral(value)
    if (parsed) {
      return { source: parsed.source, flags: parsed.flags, isRegex: true }
    }
  }
  return { source: String(value), flags: '', isRegex: false }
}

/**
 * Check if string contains regex pattern characters
 * @param {string} str
 * @returns {boolean}
 */
function isRegexPattern(str) {
  if (!str || typeof str !== 'string') return false
  return REGEX_PATTERN_CHARS.test(str)
}

const defaultOptions = {
  syntax: SYNTAX,
  open: OPEN_WORD,
  close: CLOSE_WORD,
  firstArgIsType: false,
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
 * @property {boolean} [isSingleComment] - Whether this is a single comment (no close tag)
 */

/**
 * Details about the matched comment block
 * @typedef {Object} BlockData
 * @property {string|undefined} type - Transform type (undefined when firstArgIsType=false)
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
 * @param {string|RegExp} [opts.open=OPEN_WORD] - Open tag word, regex pattern string, or RegExp (e.g., 'MyComp|Other', /MyComp/i)
 * @param {string|RegExp|false} [opts.close=CLOSE_WORD] - Close tag word, pattern, or RegExp. If omitted and open is regex-like, uses backreference. Set to false for single comment mode
 * @param {boolean} [opts.firstArgIsType=false] - Treat first arg after open word as transform type
 * @param {CustomPatterns} [opts.customPatterns] - Custom regex patterns for open and close tags
 * @returns {ParseBlocksResult} Result containing parsed blocks and patterns used
 */
function parseBlocks(contents, opts = {}) {
  const _options = Object.assign({}, defaultOptions, opts)
  const { syntax, customPatterns, firstArgIsType } = _options
  const getLineNumberAt = createLineNumberResolver(contents)

  // Extract regex source from open/close (handles RegExp objects and '/pattern/flags' strings)
  const openInfo = getRegexSource(opts.open !== undefined ? opts.open : _options.open)
  const closeIsFalse = opts.close === false
  const closeInfo = (!closeIsFalse && opts.close !== undefined)
    ? getRegexSource(/** @type {string|RegExp} */ (opts.close))
    : null

  const open = openInfo.source
  const close = closeInfo ? closeInfo.source : _options.close

  // Single comment mode: close === false means no close tag
  const singleCommentMode = closeIsFalse

  // Detect pattern mode:
  // 1. If open is RegExp or regex literal string → pattern mode
  // 2. If open contains regex chars (|, [, *, etc.) → pattern mode
  // 3. If close not provided AND open differs from default → pattern mode (single word component)
  const openIsRegex = openInfo.isRegex
  const openIsPattern = isRegexPattern(open)
  const closeProvided = opts.close !== undefined && !closeIsFalse
  const openDiffersFromDefault = open !== OPEN_WORD
  const usePatternMode = !singleCommentMode && (openIsRegex || openIsPattern || (!closeProvided && openDiffersFromDefault))

  let patterns = {}
  let hasCustomPatterns = false
  let useMatchPattern = false
  if (singleCommentMode) {
    /* Single comment mode - only match open tag, no close */
    patterns = getBlockRegex({
      syntax,
      openPattern: openIsRegex || openIsPattern ? open : undefined,
      openText: openIsRegex || openIsPattern ? undefined : open,
      singleComment: true,
    })
  } else if (customPatterns && typeof customPatterns === 'object') {
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
  } else if (usePatternMode && !closeProvided) {
    /* Pattern mode with backreference: close derived as /name */
    patterns = getBlockRegex({
      syntax,
      openPattern: open,
    })
    useMatchPattern = true
  } else if (usePatternMode && closeProvided) {
    /* Both patterns provided - use open pattern and close pattern */
    patterns = getBlockRegex({
      syntax,
      openPattern: open,
      closePattern: close,
    })
    useMatchPattern = true
  } else {
    /* Literal word mode */
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

  /* Verify comment blocks aren't broken (redos) - skip for single comment mode */
  if (!singleCommentMode) {
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
      const expectedClose = useMatchPattern && !closeProvided ? `/${open}` : close
      throw new Error(`[Parsing error]

Comment blocks are unbalanced in string

Details:
  - Found ${openCount} "${open}" open tags.
  - Found ${closeCount} "${expectedClose}" close tags.\n\n`)
    }
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

    /* Single comment mode: groups are (spaces)(fullComment)(type?)(params) */
    if (singleCommentMode) {
      // For pattern mode: (spaces)(fullComment)(type)(params)
      // For literal mode: (spaces)(fullComment)(params) - type is the open word
      const isPatternMatch = openIsRegex || openIsPattern
      let spaces, fullComment, matchedType, params

      if (isPatternMatch) {
        [ , spaces, fullComment, matchedType, params = '' ] = newMatches
      } else {
        [ , spaces, fullComment, params = '' ] = newMatches
        matchedType = open // For literal mode, type is the open word
      }

      const indent = spaces || ''
      const openStart = newMatches.index + indent.length
      const openEnd = openStart + fullComment.length
      const lineNum = getLineNumberAt(openStart)

      if (newMatches.index === newerRegex.lastIndex) {
        newerRegex.lastIndex++
      }

      const paramString = params.trim()
      const parsedOptions = paramString ? parse(paramString) : {}

      const blockData = {
        type: matchedType,
        index: blockIndex,
        lines: [lineNum, lineNum],
        position: [openStart, openEnd],
        options: parsedOptions,
        optionsStr: paramString,
        context: { isMultiline: false, isSingleComment: true },
        open: {
          start: openStart,
          end: openEnd,
          match: fullComment,
          value: fullComment,
          indent: findLeadingIndent(indent + fullComment),
        },
        content: {
          start: openEnd,
          end: openEnd,
          indent: 0,
          match: '',
          value: '',
        },
        close: {
          start: openEnd,
          end: openEnd,
          match: '',
          value: '',
          indent: 0,
        },
        block: {
          start: openStart,
          end: openEnd,
          indent: findLeadingIndent(indent + fullComment),
          match: fullComment,
          value: fullComment,
        },
      }
      newBlocks.push(blockData)
      continue
    }

    /* matchPattern mode: groups are (spaces)(openTag)(componentName)(params)(content)(closeTag)(closeName) */
    if (useMatchPattern) {
      const [ block, spaces, openTag, componentName, params = '', content, closeTag ] = newMatches
      const isMultiline = block.indexOf('\n') > -1
      const indent = spaces || ''

      if (newMatches.index === newerRegex.lastIndex) {
        newerRegex.lastIndex++
      }

      const openValue = indent + openTag
      const openStart = newMatches.index + indent.length
      const openEnd = openStart + openTag.length
      const closeEnd = newerRegex.lastIndex
      const lineOpen = getLineNumberAt(openStart)
      const lineClose = getLineNumberAt(closeEnd)
      const contentStart = openStart + openTag.length
      const contentEnd = contentStart + content.length

      let context = { isMultiline }
      const paramString = params.trim()
      const parsedOptions = paramString ? parse(paramString) : {}

      const rawContent = getTextBetweenChars(contents, contentStart, contentEnd)
      const dedentResult = dedentString(rawContent, { preserveEmptyLines: false })
      const blockDedentResult = dedentString(block, { preserveEmptyLines: false })

      const blockData = {
        type: componentName,
        index: blockIndex,
        lines: [lineOpen, lineClose],
        position: [openStart, closeEnd],
        options: parsedOptions,
        optionsStr: paramString,
        context,
        open: {
          start: openStart,
          end: openEnd,
          match: openValue,
          value: openTag,
          indent: (!context.isMultiline) ? 0 : findLeadingIndent(openValue),
        },
        content: {
          start: contentStart,
          end: contentEnd,
          indent: dedentResult.minIndent,
          match: content,
          value: dedentResult.text,
        },
        close: {
          start: contentEnd,
          end: closeEnd,
          match: closeTag,
          value: closeTag,
          indent: (!context.isMultiline) ? 0 : findLeadingIndent(closeTag),
        },
        block: {
          start: openStart,
          end: closeEnd,
          indent: blockDedentResult.minIndent,
          match: block,
          value: blockDedentResult.text,
        },
      }
      newBlocks.push(blockData)
      continue
    }

    const [ block, spaces, openTag, type, params = '', content, closeTag ] = newMatches

    let transformType
    if (firstArgIsType) {
      transformType = type
      paramString = params.trim()
      /* Account for dashes in transform name. E.g. funky-name-here */
      const dashInTransform = params.match(/^(-[^\s]*)/)
      if (dashInTransform && dashInTransform[1]) {
        transformType = type + dashInTransform[1]
        paramString = paramString.replace(dashInTransform[1], '')
      }
    } else {
      /* No transform type - everything is options */
      transformType = undefined
      paramString = (type + ' ' + params).trim()
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

    const lineOpen = getLineNumberAt(openStart)
    const lineClose = getLineNumberAt(closeEnd)

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

/**
 * Build a fast line-number resolver for character offsets
 * @param {string} input
 * @returns {(position: number) => number}
 */
function createLineNumberResolver(input) {
  const newlineIndexes = []
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) === 10) {
      newlineIndexes.push(i)
    }
  }

  return function getLineNumberAt(position) {
    if (position <= 0) return 1

    let low = 0
    let high = newlineIndexes.length
    while (low < high) {
      const mid = (low + high) >> 1
      if (newlineIndexes[mid] < position) {
        low = mid + 1
      } else {
        high = mid
      }
    }
    return low + 1
  }
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
 * @typedef {{blockPattern: RegExp, openPattern: RegExp, closePattern: RegExp, isPatternMode?: boolean, isSingleComment?: boolean}} RegexPatterns
 */

/**
 * Get Regex pattern to match block
 * @param {object} options
 * @param {string} [options.syntax] - comment syntax type
 * @param {string} [options.openText] - literal open word
 * @param {string} [options.closeText] - literal close word
 * @param {string} [options.openPattern] - regex pattern for open (e.g., 'MyComp|Other')
 * @param {string} [options.closePattern] - regex pattern for close. If omitted with openPattern, uses backreference
 * @param {string} [options.openEmoji] - emoji marker
 * @param {boolean} [options.allowMissingTransforms] - Allow for missing transform key
 * @param {boolean} [options.singleComment] - Match single comments only (no close tag)
 * @returns {RegexPatterns}
 */
function getBlockRegex({
  openEmoji,
  syntax = SYNTAX,
  openText = '',
  closeText = '',
  openPattern: openPat,
  closePattern: closePat,
  allowMissingTransforms = false,
  singleComment = false
}) {
  if (!openPat && !openText) {
    throw new Error('Missing options.open or options.openPattern')
  }
  if (!singleComment && !openPat && !closeText) {
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

  /* Single comment mode - match individual comments without close tag */
  if (singleComment) {
    const emojiPat = (openEmoji) ? `(?:\\s*${openEmoji})?` : '(?:\\s*⛔️)?'
    const matchText = openPat || openText
    const isPattern = Boolean(openPat) || isRegexPattern(matchText)

    // Build the open pattern - captures: (1:spaces)(2:fullComment(3:type)(4:params))
    const open = isPattern
      ? `(${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)(${matchText})\\s*((?:.|\\r?\\n)*?)${closeComment})`
      : `(${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)\\b${matchText}\\b\\s*((?:.|\\r?\\n)*?)${closeComment})`

    const blockPattern = new RegExp(`([ \\t]*)${open}`, 'gmi')
    const openPattern = new RegExp(open, 'gi')
    // No close pattern for single comments
    const closePattern = new RegExp('$^', 'g') // Never matches

    return {
      blockPattern,
      openPattern,
      closePattern,
      isSingleComment: true,
    }
  }

  /* Pattern mode - openPattern provided */
  if (openPat) {
    const emojiPat = (openEmoji) ? `(?:\\s*${openEmoji})?` : '(?:\\s*⛔️)?'

    if (closePat) {
      /* Both patterns provided - use them directly */
      const open = `(${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)(${openPat})\\s*((?:.|\\r?\\n)*?)${closeComment}\\n?)`
      const close = `(\\n?[ \\t]*${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)(${closePat})(?:.|\\r?\\n)*?${closeComment})`
      const blockPattern = new RegExp(`([ \\t]*)${open}([\\s\\S]*?)${close}`, 'gmi')
      return {
        blockPattern,
        openPattern: new RegExp(open, 'gi'),
        closePattern: new RegExp(close, 'gi'),
        isPatternMode: true,
      }
    }

    /* Backreference mode - close derived as /name */
    // Capture component name, then params
    // Group structure: (spaces)(openTag with (componentName)(params))(content)(closeTag)
    const open = `(${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)(${openPat})\\s*((?:.|\\r?\\n)*?)${closeComment}\\n?)`
    // Close uses backreference \3 to match captured component name (prefixed with /)
    const close = `(\\n?[ \\t]*${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)/(\\3)(?:.|\\r?\\n)*?${closeComment})`
    // Full pattern: (1:spaces)(2:openTag(3:name)(4:params))(5:content)(6:closeTag(7:nameRef))
    const blockPattern = new RegExp(`([ \\t]*)${open}([\\s\\S]*?)${close}`, 'gmi')
    return {
      blockPattern,
      openPattern: new RegExp(open, 'gi'),
      closePattern: new RegExp(`(\\n?[ \\t]*${openComment}${emojiPat}(?:\\r?|\\n?|\\s*)/(${openPat})(?:.|\\r?\\n)*?${closeComment})`, 'gi'),
      isPatternMode: true,
    }
  }

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