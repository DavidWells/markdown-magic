
const weirdParse = require('./weird-parse')

const config = {
  matchWord: 'DOCS'
}

function parseBlocks(content) {
  const matchWord = `DOCS`
  const transformsToRun = []
  // const blockRegex = new RegExp(
  //   `(.*)(?:\\<\\!--(?:.*|\r?|\n?|\\s*)${matchWord}:START(?:(?:.|\\r?\\n)*?(?:\\()(.*)\\))?(.|\\r?\\n)*?)?<\!--(?:.*|\r?|\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gm'
  // )
  //  `(?:.*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,

  const regexToUse = new RegExp(
    `([ \\t]*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{]*[A-Za-z0-9_$-]*[)\\]\\}]*)\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
    'gmi'
  )
  // console.log('regexToUse', regexToUse)

  while ((array1 = regexToUse.exec(content)) !== null) {
    if (array1.index === regexToUse.lastIndex) {
      regexToUse.lastIndex++ // This is necessary to avoid infinite loops
    }
    let props = {}
    let meta = {}
    const [block, spaces, action, params] = array1
    console.log('block', block)
    // console.log('spaces', `"${spaces}"`)
    const indentation = spaces || ''
    const openingTag = getOpeningTags(block, config, indentation)
    const closingTag = getClosingTags(block, config, indentation)
    console.log('openingTag', openingTag)
    console.log('closingTag', closingTag)

    // console.log('SIZE', openingTag.length + spaces.length)
    // console.log(array1.index)
    const finOpen = openingTag.length //+ indentation.length
    const contentEndPosition = block.indexOf(closingTag.tag, finOpen)
    let originalContent = getTextBetween(block, finOpen, contentEndPosition)
    const contentEndsWithNewLine = originalContent.substr(-1) === '\n'
    const closeTag = (contentEndsWithNewLine) ? `\n${closingTag.tag}` : closingTag.tag
    // Strip indentation
    // originalContent = stripIndent(originalContent, indentation.length)
  
    // Move new line to beginning of closing tag
    // if (originalContent.match(/\n$/)) {
    if (contentEndsWithNewLine) {
      // originalContent = originalContent.replace(/\n$/, '')
      originalContent = originalContent.slice(0, -1)
    }

    console.log('originalContent')
    console.log(`"${originalContent}"`)
    // originalContent = originalContent.replace(/^\s+|\s+$/g, '')

    // (functionName) or [functionName] or {functionName}
    const transform = action.replace(/[(\[\{]*([A-Z-a-z0-9_$-]*)[)\]\}]*/, '$1')

    if (transform && !transform.match(/^-+/)) {
      // console.log('params', params)
      const paramValue = params.match(/([\s\S]*?)-->/gm)
      let paramString
      if (paramValue) {
        paramString = paramValue[0].replace(/-*>$/, '').trim()
        // console.log('paramString', paramString)
        if (paramString) {
          // Legacy v1 options parser
          const isLegacy = paramString.startsWith(':')
          if (isLegacy) {
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
      const contentBegin = array1.index + openingTag.tag.length
     
      transformsToRun.push({
        transform,
        args: props,
        block: {
          indentation,
          start: array1.index,
          end: regexToUse.lastIndex,
          contentStart: contentBegin,
          contentEnd: contentBegin + originalContent.length,
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

  return transformsToRun
}

function getLeadingSpaces(text) {
  return text.match(/^\s/) ? text : ''
}

function getTextBetween(text, start, end) {
  return text.slice(start, end)
}

function stripIndent(string, indent = 0) {
	if (indent === 0) {
		return string
	}
	const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm')
	return string.replace(regex, '')
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

function getOpeningTags(block, config) {
  const openTagRegex = matchOpeningCommentTag(config.matchWord)
  // console.log('openTagRegex', openTagRegex)
  let matches
  while ((matches = openTagRegex.exec(block)) !== null) {
    if (matches.index === openTagRegex.lastIndex) {
      openTagRegex.lastIndex++  // avoid infinite loops with zero-width matches
    }
    const [ tag, spaces, tagStart, tagEnd ] = matches
    /*
    console.log('FULL Open Tag >>>>>', matches[0])
    console.log('openTag Start', "'"+matches[1]+"'");
    console.log('openTag End', "'"+matches[2]+"'");
    /**/
    return {
      tag,
      spaces: spaces || '',
      length: tag.length,
      tagStart,
      tagEnd,
    }
  }
}

function getClosingTags(block, config) {
  const closeTagRegex = matchClosingCommentTag(config.matchWord)
  // console.log('closeTagRegex', closeTagRegex)
  let matches
  while ((matches = closeTagRegex.exec(block)) !== null) {
    if (matches.index === closeTagRegex.lastIndex) {
      closeTagRegex.lastIndex++ // avoid infinite loops with zero-width matches
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


function matchOpeningCommentTag(word) {
  // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
  return new RegExp(`([ \\t]*)(\\<\\!--(?:.*|\r?|\n?|\s*)${word}:START)((?:.|\\r?\\n)*?--\\>\n?)`, 'gi')
}

function matchClosingCommentTag(word) {
  return new RegExp(`--\\>(?:.|\\r?\\n)*?([ \t]*)((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${word}:END)((?:.|\\r?\\n)*?--\\>)`, 'gi')
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
  parseBlocks
}