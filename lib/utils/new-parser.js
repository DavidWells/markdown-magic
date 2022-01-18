
const weirdParse = require('./weird-parse')

const html = {
  tags: ['<!--', '-->'],
  pattern: ['<!--+', '-->'],
}

const jsx = {
  tags: ['{/*', '*/}'],
  pattern: [
    '\{\/\\*+',
    '\\*+/\}'
  ]
}

const yaml = {
  tags: ['##', '##'],
  pattern: [
    '##+',
    '##+'
  ],
  converter: (str) => {
    return str.split('\n').map((line) => {
      return line[0] === '#' ? line : `#${line}`
    }).join()
  }
}

const syntaxMap = {
  // <!-- x -->
  md: html,
  // <!-- x -->
  html: html,
  // /* x */
  js: {
    tags: ['/*', '*/'],
    pattern: [
      '\/\\*+', // '\/\*[\*\n\s\t]+', // 
      '\\*+/'
    ],
  },
  // {/* x */}
  jsx: jsx,
  mdx: jsx,
  // ## x ##
  yaml: yaml,
  yml: yaml
}

function convertCommentSyntax({
  str, 
  from, 
  to
}) {
  const [ openPattern, closePattern ] = syntaxMap[from].pattern
  const [ openTag, closeTag ] = syntaxMap[to].tags
  const match = ` *?\\${openPattern}([\\s\\S]*?)?${closePattern}\\n\\n*?`
  // const match = `${openPattern}(.*|\\r?|\\n?|\\s*)*${closePattern}`
  const regexToUse = new RegExp(match, 'g')
  // console.log('regexToUse', regexToUse)
  const found = str.match(regexToUse)
  if (!found) {
    return str
  }
  const newComment = found[0].replace(regexToUse, `${openTag}$1${closeTag}`)
  const converter = syntaxMap[to].converter
  const newText = (converter) ? converter(newComment) : newComment
  return str.replace(regexToUse, newText)
}

const defaultOptions = {
  syntax: 'md',
  open: `DOCS:START`,
  close: `DOCS:END`,
}

function parseBlocks(contents, options = defaultOptions) {
  const { syntax } = options
  const transformsToRun = []
  // const blockRegex = new RegExp(
  //   `(.*)(?:\\<\\!--(?:.*|\r?|\n?|\\s*)${matchWord}:START(?:(?:.|\\r?\\n)*?(?:\\()(.*)\\))?(.|\\r?\\n)*?)?<\!--(?:.*|\r?|\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gm'
  // )
  //  `(?:.*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  const START = options.open
  const END = options.close

  const [ commentOpen, commentClose ] = syntaxMap[syntax].pattern
  // const regexToUse = new RegExp(
  //   `([ \\t]*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gmi'
  // )
  const regexToUse = new RegExp(
    `([ \\t]*)(?:${commentOpen}(?:.*|\\r?|\\n?|\\s*)${START}\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)${commentOpen}(?:.*|\\r?|\\n?|\\s*)${END}(?:.|\\r?\\n)*?${commentClose}`,
    'gmi'
  )
  const paramsRegex = new RegExp(`([\\s\\S]*?)${commentClose}`, 'gm')
  const trimRegex = new RegExp(`${commentClose}$`)
  
  // console.log('paramsRegex', paramsRegex)
  // ([ \t]*)(?:\/\*(?:.*|\r?|\n?|\s*)XYZ:START\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.|\r?\n)*?)\/\*(?:.*|\r?|\n?|\s*)XYZ:END(?:.|\r?\n)*?\*\/
  // console.log('regexToUse', regexToUse)

  let openTagRegex = matchOpeningCommentTag(START, commentOpen, commentClose)
  let closeTagRegex = matchClosingCommentTag(END, commentOpen, commentClose)
  while ((commentMatches = regexToUse.exec(contents)) !== null) {
    let props = {}
    let meta = {}
    const [ block, spaces, action, params ] = commentMatches
    const indentation = spaces || ''
    /*
    console.log('index', commentMatches.index)
    console.log('block', block)
    console.log('action', action)
    console.log('params', params)
    console.log('spaces', `"${spaces}"`)
    /** */
    // This is necessary to avoid infinite loops
    if (commentMatches.index === regexToUse.lastIndex) {
      regexToUse.lastIndex++
    }

    openTagRegex = matchOpeningCommentTag(START, commentOpen, commentClose)
    const openingTag = getOpeningTags(block, {
      pattern: openTagRegex, 
      open: commentOpen, 
      close: commentClose
    })
    closeTagRegex = matchClosingCommentTag(END, commentOpen, commentClose)
    const closingTag = getClosingTags(block, {
      pattern: closeTagRegex
    })
    /*
    console.log('openingTag', openingTag)
    console.log('closingTag', closingTag)
    /** */
    const openingTagLength = openingTag.length //+ indentation.length
    const contentEndPosition = block.indexOf(closingTag.tag, openingTagLength)
    const content = getTextBetween(block, openingTagLength, contentEndPosition)
    // console.log('contentcontent', content)
    let originalContent = content
    const contentEndsWithNewLine = getLastCharacter(originalContent) === '\n'
    const openEndsWithNewLine = getLastCharacter(openingTag.tag) === '\n'
    const isMultiline = block.indexOf('\n') > -1
    meta.isMultiline = isMultiline
    const closeTag = (contentEndsWithNewLine) ? `\n${closingTag.tag}` : closingTag.tag

    // Move new line to beginning of closing tag
    // if (originalContent.match(/\n$/)) {
    if (contentEndsWithNewLine) {
      // originalContent = originalContent.replace(/\n$/, '')
      originalContent = originalContent.slice(0, -1)
    }

    // Strip indentation
    originalContent = stripIndent(originalContent, indentation.length)
    // console.log('originalContent')
    // console.log(`"${originalContent}"`)
    // originalContent = originalContent.replace(/^\s+|\s+$/g, '')

    // (functionName) or [functionName] or {functionName}
    const transform = action.replace(/[(\[\{]*([A-Z-a-z0-9_$-]*)[)\]\}]*/, '$1')
    // if (transform && !transform.match(/^-+/)) {
    if (transform && getFirstCharacter(transform) !== '-') {
      // console.log('params', params)
      // const paramValue = params.match(/([\s\S]*?)-->/gm)
      const paramValue = params.match(paramsRegex)
      let paramString
      if (paramValue) {
        // paramString = paramValue[0].replace(/-*>$/, '').trim()
        paramString = paramValue[0].replace(trimRegex, '').trim()
        // console.log('paramString', paramString)
        if (paramString) {
          // Legacy v1 options parser
          if (getFirstCharacter(paramString) === ':') {
            meta.isLegacy = true
            paramString = paramString.replace(/\s?\)\s?$/, '').substring(1)
            props = legacyParseOptions(paramString)
          } else {
            props = weirdParse(paramString) 
          }
        }
      }
      /*
      console.log(regexToUse)
      console.log(`transform "${transform}" at ${regexToUse.lastIndex} using props:`)
      console.log(props)
      console.log('───────────────────────')
      /** */
      const shift = (openEndsWithNewLine) ? 1 : 0
      const contentStart = commentMatches.index + openingTag.tag.length - shift //+ indentation.length
      const contentEnd = contentStart + content.length + indentation.length + shift
      //const addOne = (contentEndsWithNewLine) ? 1 : 0
      transformsToRun.push({
        transform,
        args: props,
        // content: originalContent,
        block: {
          indentation,
          start: commentMatches.index,
          end: regexToUse.lastIndex,
          contentStart,
          contentEnd,
          contentIndent: minIndent(originalContent),
          openTag: openingTag.tag,
          content: originalContent,
          closeTag: closeTag,
          // full: `${openingTag.tag}${indentString(originalContent, indentation.length)}${closeTag}`,
          // full: indentString(`${openingTag.tag}${originalContent}${closeTag}`, indentation.length),
          // full: indentString(`${stripIndent(openingTag.tag, indentation.length)}${originalContent}${stripIndent(closeTag, indentation.length)}`, indentation.length)
        },
        raw: {
          transform: (meta.isLegacy) ? action.replace(/^\s?\(/, '') : action,
          args: paramString,
          content: getTextBetween(contents, contentStart, contentEnd),
          block: block,
        },
        meta,
      })
    }
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
    transforms: transformsToRun
  }
}

function replaceTextBetween(origin, startIndex, endIndex, insertion) {
  return origin.substring(0, startIndex) + insertion + origin.substring(endIndex)
}

function replaceContent(origin, insertion, data) {
  return replaceTextBetween(origin, data.block.contentStart, data.block.contentEnd, insertion)
}

function getFirstCharacter(str) {
  return str.charAt(0)
}

function getLastCharacter(str) {
  return str.substr(-1)
}

function getLeadingSpaces(text) {
  return text.match(/^\s/) ? text : ''
}

function getTextBetween(text, start, end) {
  return text.slice(start, end)
}

function stripIndent(string, indentation) {
  const indent = typeof indentation !== 'undefined' ? indentation : minIndent(string);
	if (indent === 0) {
		return string
	}
	const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm')
	return string.replace(regex, '')
}

// https://github.com/jamiebuilds/min-indent/blob/master/index.js
function minIndent(string) {
	const match = string.match(/^[ \t]*(?=\S)/gm)
	if (!match) return 0
	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

function indentString(string, count = 1, options = {}) {
	const {
		indent = ' ',
		includeEmptyLines = false
	} = options;
	if (count === 0) return string
	const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm
	return string.replace(regex, indent.repeat(count))
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
  const fallbackRegex = new RegExp(`^([ \\t]*)(${open}([\\s\\S]*?)${close})\\n?`)
  // const xyz = block.match(/^([ \t]*)(\/\*+([\s\S]*?)\*+\/)/)
  const xyz = block.match(fallbackRegex)
  /*
  console.log('fallbackRegex', fallbackRegex)
  console.log('fall through', `"${block}"`)
  console.log('xyz', xyz)
  /** */
  return {
    tag: xyz[0],
    spaces: xyz[1] || '',
    length: xyz[0].length,
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

function removeComments(str) {
  // /([^\s]*)?([ \\t]*)\<\!-+\s?([\s\S]*?)?-+\>\n*?([^\s]*)?/gi
  const pattern = new RegExp(`([^\\s]*)?([ \\t]*)<!-+\\s?([\\s\\S]*?)?-+>\n*?([^\\s]*)?`, 'gi')
  return str.replace(pattern, '')
}

function matchOpeningCommentTag(word, open, close) {
  // console.log('open', open)
  // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
  return new RegExp(`([ \\t]*)(${open}(?:.|\r?|\n?|\\s*)\\b${word}\\b)((?:.|\\r?\\n)*?${close}\n?)`, 'gi')
  // return new RegExp(`([ \\t]*)(\\<\\!--(?:.*|\r?|\n?|\s*)${word}:START)((?:.|\\r?\\n)*?--\\>\n?)`, 'gi')
}

function matchClosingCommentTag(word, open, close) {
  return new RegExp(`${close}(?:.|\\r?\\n)*?([ \t]*)((?:${open}(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?\\b${word}\\b)((?:.|\\r?\\n)*?${close})`, 'gi')
  // return new RegExp(`--\\>(?:.|\\r?\\n)*?([ \t]*)((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${word}:END)((?:.|\\r?\\n)*?--\\>)`, 'gi')
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
  getTextBetween,
  replaceTextBetween,
  replaceContent,
  parseBlocks,
}