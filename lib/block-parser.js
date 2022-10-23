
const { optionsParse } = require('./options-parser')
const { syntaxMap, getSyntaxInfo } = require('./utils/syntax')
const { 
  getFirstCharacter, 
  getLastCharacter, 
  getTextBetweenChars,
  stripIndent, 
  findMinIndent 
} = require('./utils/text')

// Alt parser https://github.com/LesterLyu/fast-formula-parser/blob/master/grammar/lexing.js

const defaultOptions = {
  syntax: 'md',
  open: `DOCS:START`,
  close: `DOCS:END`,
  ignoreFirst: true
}

function parseBlocks(contents, options = defaultOptions) {
  const syntax = options.syntax || defaultOptions.syntax

  const blocks = []
  // const blockRegex = new RegExp(
  //   `(.*)(?:\\<\\!--(?:.*|\r?|\n?|\\s*)${matchWord}:START(?:(?:.|\\r?\\n)*?(?:\\()(.*)\\))?(.|\\r?\\n)*?)?<\!--(?:.*|\r?|\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gm'
  // )
  //  `(?:.*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  const START = options.open
  const END = options.close

  if (!START || !END) {
    throw new Error('Missing options.open or options.close')
  }

  const [ commentOpen, commentClose ] = getSyntaxInfo(syntax).pattern
  // const regexToUse = new RegExp(
  //   `([ \\t]*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gmi'
  // )
  // const regexToUse = new RegExp(
  //   `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${START}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${END}(?:.|\\r?\\n)*?${commentClose}`,
  //   'gmi'
  // )
  // const regexToUse = new RegExp(
  //   `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${START}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.*?|.*?\\r?\\n?)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${END}(?:.|\\r?\\n)*?${commentClose}`,
  //   'gmi'
  // )
  const regexToUse = getBlockRegex({ commentOpen, commentClose, start: START, ending: END })

  // console.log('regexToUse', regexToUse)
  const paramsRegex = new RegExp(`([\\s\\S]*?)${commentClose}`, 'gm')
  //console.log('paramsRegex', paramsRegex)
  const trimRegex = new RegExp(`${commentClose}$`)
  // ([ \t]*)(?:\/\*(?:.*|\r?|\n?|\s*)XYZ:START\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.|\r?\n)*?)\/\*(?:.*|\r?|\n?|\s*)XYZ:END(?:.|\r?\n)*?\*\/

  let openTagRegex = getOpenCommentRegex(START, commentOpen, commentClose)
  let closeTagRegex = getClosingCommentRegex(END, commentOpen, commentClose)
  // console.log('openTagRegex', openTagRegex)
  // console.log('closeTagRegex', closeTagRegex)
  
  /* Verify comment blocks aren't broken (redos) */
  const { isBalanced, openCount, closeCount } = verifyTagsBalanced(contents, openTagRegex, closeTagRegex)
  const balanced = (closeCount > openCount) ? true : isBalanced
  if (!balanced) {
    throw new Error(`Blocks are unbalanced.
    ${openCount} "${START}" open tags.
    ${closeCount} "${END}" close tags.
    `)
  }
  while ((commentMatches = regexToUse.exec(contents)) !== null) {
    let props = {}
    let paramString = ''
    const [ block, spaces, __type, params ] = commentMatches
    const isMultiline = block.indexOf('\n') > -1
    let context = {
      isMultiline,
    }
    // console.log('commentMatches', commentMatches)
    const indentation = spaces || ''
    // Remove trailing -- if no params
    const type = __type.replace(/-*$/, '')
    /*
    console.log('index', commentMatches.index)
    console.log('block', block)
    console.log('type', type)
    console.log('params', params)
    console.log('spaces', `"${spaces}"`)
    /** */
    // This is necessary to avoid infinite loops
    if (commentMatches.index === regexToUse.lastIndex) {
      regexToUse.lastIndex++
    }

    openTagRegex = getOpenCommentRegex(START, commentOpen, commentClose)
    // console.log('openTagRegex', openTagRegex)
    const openingTag = getOpeningTags(block, {
      pattern: openTagRegex, 
      open: commentOpen, 
      close: commentClose
    })
    closeTagRegex = getClosingCommentRegex(END, commentOpen, commentClose)
    // console.log('closeTagRegex', closeTagRegex)
    const closingTag = getClosingTags(block, {
      pattern: closeTagRegex
    })
    /*
    console.log('openingTag', openingTag)
    console.log('closingTag', closingTag)
    /** */
    if (!openingTag || !closingTag) {
      continue;
    }
    
    const openingTagLength = openingTag.length //+ indentation.length
    const contentEndPosition = block.indexOf(closingTag.tag, openingTagLength)
    const content = getTextBetweenChars(block, openingTagLength, contentEndPosition)
    // console.log('contentcontent', content)
    let originalContent = content
    const contentEndsWithNewLine = getLastCharacter(originalContent) === '\n'
    const openEndsWithNewLine = getLastCharacter(openingTag.tag) === '\n'

    const closeTag = (contentEndsWithNewLine) ? `\n${closingTag.tag}` : closingTag.tag

    // Move new line to beginning of closing tag
    // if (originalContent.match(/\n$/)) {
    if (contentEndsWithNewLine) {
      // originalContent = originalContent.replace(/\n$/, '')
      originalContent = originalContent.slice(0, -1)
    }
    /* Strip indentation */
    originalContent = stripIndent(originalContent, indentation.length)
    // originalContent = originalContent.replace(/^\s+|\s+$/g, '')
    /*
    console.log('originalContent')
    console.log(`"${originalContent}"`)
    /** */
    
    /* strip brackets (functionName) or [functionName] or {functionName} */
    const cleanType = stripBrackets(type)
    const shift = (openEndsWithNewLine) ? 1 : 0
    const lineOpen = contents.substr(0, commentMatches.index).split('\n').length
    const lineClose = contents.substr(0, regexToUse.lastIndex).split('\n').length
    const contentStart = commentMatches.index + openingTag.tag.length - shift //+ indentation.length
    /* If single line comment block, remove indentation */
    const finIndentation = (lineOpen === lineClose) ? '' : indentation
    const contentEnd = contentStart + content.length + finIndentation.length + shift
    
    // if (cleanType && !cleanType.match(/^-+/)) {
    if (cleanType && getFirstCharacter(cleanType) !== '-') {
      // console.log('params', params)
      // const paramValue = params.match(/([\s\S]*?)-->/gm)
      const paramValue = params.match(paramsRegex)
      if (paramValue) {
        // paramString = paramValue[0].replace(/-*>$/, '').trim()
        paramString = paramValue[0].replace(trimRegex, '').trim()
        // console.log('paramString', paramString)
        if (paramString) {
          // Legacy v1 options parser
          if (getFirstCharacter(paramString) === ':' || getFirstCharacter(paramString) === '?') {
            context.isLegacy = true
            paramString = paramString.replace(/\s?\)\s?$/, '').substring(1)
            // console.log('fixed paramString', paramString)
            props = legacyParseOptions(paramString)
          } else {
            if (type.startsWith('(') && paramString.endsWith(')')) {
              paramString = paramString.replace(/\)$/, '')
            }
            props = optionsParse(paramString) 
          }
        }
      }
      /*
      console.log(regexToUse)
      console.log(`cleanType "${cleanType}" at ${regexToUse.lastIndex} using props:`)
      console.log(props)
      console.log('───────────────────────')
      /** */
    }

    /* Add found block */
    blocks.push({
      type: cleanType,
      options: props,
      context,
      /* Open Tag */
      open: {
        value: openingTag.tag,
        start: commentMatches.index,
        end: contentStart
      },
      /* Inner Content */
      content: {
        value: originalContent,
        start: contentStart,
        end: contentEnd,
        indentation: findMinIndent(originalContent),
      },
      /* Close Tag */
      close: {
        value: closeTag,
        start: contentEnd,
        end: regexToUse.lastIndex
      },
      /* Full Block */
      block: {
        indentation: finIndentation,
        lines: [lineOpen, lineClose],
        start: commentMatches.index,
        end: regexToUse.lastIndex,
        // position: [ commentMatches.index, regexToUse.lastIndex ],
        rawType: (context.isLegacy) ? type.replace(/^\s?\(/, '') : type,
        rawArgs: paramString,
        rawContent: getTextBetweenChars(contents, contentStart, contentEnd),
        value: block,
      },
    })
  }
  // const newer =
  //   /(?:.*)(?:\<\!--(?:.*|\r?|\n?|\s*)DOCS:START\s*([(\[\{][A-Z-a-z_$-]*[)\]\}])\s*)((?:.|\r?\n)*?)<\!--(?:.*|\r?|\n?|\s*)DOCS:END(?:.|\r?\n)*?--\>/gmi
  // // console.log('newera', newer)
  /*
  const comments = content.match(newerString)
  console.log('comments', comments)
  const commentRegexInside = /<\!-*\s*([\s\S]*?) ?-*\>\n*?/g
  if (comments) {
    // console.log('comments', comments)
    // console.log(comments.length)
    comments.forEach((text) => {
      console.log('text', text)
      const inside = commentRegexInside.exec(text)
      console.log('inside', inside)
      if (inside) {
        const config = inside[1].replace(`${matchWord}:START`, '').trim()
        // console.log(formatProps(config))
      }
    })
  }*/
  return {
    pattern: regexToUse,
    commentOpen: openTagRegex,
    commentClose: closeTagRegex,
    blocks
  }
}

function verifyTagsBalanced(str, open, close) {
  const openCount = (str.match(open) || []).length
  const closeCount = (str.match(close) || []).length
  return {
    isBalanced: openCount === closeCount,
    openCount,
    closeCount
  }
}

function getOpeningTags(block, {
  pattern, 
  open,
  close
}) {
  // console.log(block.match(/^\/\*+(.*)\*\//))
  // console.log('openTagRegex', pattern)
  let matches
  while ((matches = pattern.exec(block)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++  // avoid infinite loops with zero-width matches
    }
    const [ tag, spaces, tagStart, tagEnd ] = matches
    /*
    console.log('FULL Open Tag >>>>>', tag)
    console.log('openTag Start', "'"+tagStart+"'");
    console.log('openTag End', "'"+tagEnd+"'");
    /**/
    return {
      tag,
      spaces: spaces || '',
      length: tag.length,
      tagStart,
      tagEnd,
    }
  }

  // Fallthrough
  // const fallbackRegex = new RegExp(`^([ \\t]*)(${open}([\\s\\S]*?)${close})\\n?`)
  const fallbackRegex = new RegExp(`^([ \\t]*)(\\b${open}\\b([\\s\\S]*?)${close})\\n?`)
  // const xyz = block.match(/^([ \t]*)(\/\*+([\s\S]*?)\*+\/)/)
  const fallbackMatch= block.match(fallbackRegex)
  if (fallbackMatch) {
    /*
    console.log('fallbackRegex', fallbackRegex)
    console.log('fall through', `"${block}"`)
    console.log('xyz', xyz)
    /** */
    return {
      fallthrough: true,
      tag: fallbackMatch[0],
      spaces: fallbackMatch[1] || '',
      length: fallbackMatch[0].length,
    }
  }
}

function getClosingTags(block, {
  pattern, 
  // open,
  // close
}) {
  // console.log('closeTagRegex', closeTagRegex)
  let matches
  while ((matches = pattern.exec(block)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ _tag, spaces, tagStart, tagEnd] = matches
    /*
    console.log('FULL CLOSE Tag >>>>>', matches[0])
    console.log('closeTag Start', "'"+matches[1]+"'");
    console.log('closeTag End', "'"+matches[2]+"'");
    /**/
    const tag = spaces + tagStart + tagEnd
    return {
      tag: tag,
      length: tag.length,
      spaces: spaces || '',
      tagStart,
      tagEnd
    }
  }
}

/**
 * Get Regex pattern to match block
 * @param {object} options
 * @param {string} [options.commentOpen] - comment syntax open
 * @param {string} [options.commentClose] - comment syntax open
 * @param {string} [options.start] - comment open word
 * @param {string} [options.ending] - comment close word
 * @returns {RegExp}
 */
function getBlockRegex({ commentOpen, commentClose, start, ending }) {
  return new RegExp(
    `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${start}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.*?|.*?\\r?\\n?)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${ending}(?:.|\\r?\\n)*?${commentClose}`,
    'gmi'
  )
}

// NAmed matches
/*
(?<leading>[ \t]*)(?:<!-{2,}(?:.*|\r?|\n?|\s*)MD-MAGIC-EXAMPLE:START\s*(?<key>[(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)([\s\S]*?)-->(?<content>(?:.*?|.*?\r?\n?)*?)<!-{2,}(?:.*|\r?|\n?|\s*)MD-MAGIC-EXAMPLE:END(?:.|\r?\n)*?-{2,}>
*/


function newGetBlockRegex({ commentOpen, commentClose, start, ending }) {
  return new RegExp(
    `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${start}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)([\\s\\S]*?)-->((?:.*?|.*?\\r?\\n?)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${ending}(?:.|\\r?\\n)*?${commentClose}`,
    'gmi'
  )
}

function getOpenCommentRegex(word, open, close) {
  // console.log('open', open)
  // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
  return new RegExp(`([ \\t]*)(${open}(?:.|\r?|\n?|\\s*)\\b${word}\\b)((?:.|\\r?\\n)*?${close}\n?)`, 'gi')
}

function getClosingCommentRegex(word, open, close) {
  const boundary = word.indexOf('/') > -1 ? '' : '\\b'
  return new RegExp(`${close}(?:.|\\r?\\n)*?([ \t]*)((?:${open}(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${boundary}${word}${boundary})((?:.|\\r?\\n)*?${close})`, 'gi')
  // return new RegExp(`--\\>(?:.|\\r?\\n)*?([ \t]*)((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${word}:END)((?:.|\\r?\\n)*?--\\>)`, 'gi')
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


module.exports = {
  getBlockRegex,
  parseBlocks,
}