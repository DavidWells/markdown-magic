const { syntaxMap } = require('./syntax')

/**
 * Split string into lines
 * @param {string} str - Input string
 * @returns {string[]} Array of lines
 */
function getLines(str = '') {
  return str.split(/\r\n|\r|\n/)
}

/**
 * Get line count from string
 * @param {string} str - Input string
 * @returns {number} Number of lines
 */
function getLineCount(str = '') {
  return getLines(str).length
}

/**
 * Get row and column position from character index
 * @param {string} input - Input string
 * @param {number} indexToFind - Character index to find
 * @returns {{row: number, col: number}} Row and column position
 */
function getRowAndColumnFromCharPos(input, indexToFind) {
  const preChunk = input.substr(0, indexToFind);
  const row = preChunk.split('\n').length - 1
  const lastIndexOfNewLine = input.lastIndexOf('\n', indexToFind);
  const col = lastIndexOfNewLine > 0 ? indexToFind - lastIndexOfNewLine - 1 : indexToFind;
  return { row, col }
};

/**
 * Get word count from string
 * @param {string} str - Input string
 * @returns {number} Word count
 */
function getWordCount(str = '') {
  return str.trim().split(/\s+/).length
}

/**
 * Get first character from string
 * @param {string} str - Input string
 * @returns {string} First character
 */
function getFirstCharacter(str) {
  return str.charAt(0)
}

/**
 * Get last character from string
 * @param {string} str - Input string
 * @returns {string} Last character
 */
function getLastCharacter(str) {
  return str.substr(-1)
}

/**
 * Get leading spaces from text
 * @param {string} text - Input text
 * @returns {string} Leading spaces
 */
function getLeadingSpaces(text) {
  const matches = text.match(/^\s*/)
  return (matches && matches[0]) ? matches[0] : ''
}

/**
 * Get text between character positions
 * @param {string} text - Input text
 * @param {number} start - Start position
 * @param {number} end - End position
 * @returns {string} Text between positions
 */
function getTextBetweenChars(text, start, end) {
  return text.slice(start, end)
}

/**
 * Get text between two words
 * @param {string} s 
 * @param {string} prefix 
 * @param {string} suffix
 * @returns {string}
 */
function getTextBetweenWords(s, prefix, suffix) {
  let i = s.indexOf(prefix)
  if (i === -1) return ''
  s = s.substring(i + prefix.length)
  if (suffix) {
    i = s.indexOf(suffix)
    if (i === -1) return ''
    s = s.substring(0, i)
  }
  return s
}

/**
 * Replace text between character positions
 * @param {string} str - Input string
 * @param {number} start - Start position
 * @param {number} end - End position
 * @param {string} newStr - Replacement string
 * @returns {string} Modified string
 */
function replaceTextBetweenChars(str = '', start, end, newStr) {
  return str.substring(0, start) + newStr + str.substring(end)
}

/**
 * Retrieves the text content between the specified start and end lines.
 *
 * @param {string} content - The content to extract text from.
 * @param {number} startLine - The line number where the extraction should start.
 * @param {number} endLine - The line number where the extraction should end.
 * @returns {string|undefined} - The extracted text content, or undefined if both startLine and endLine are not defined.
 */
function getTextBetweenLines(content, startLine, endLine) {
  const startDefined = typeof startLine !== 'undefined'
  const endDefined = typeof endLine !== 'undefined'
  if (!startDefined && !endDefined) return

  const lines = getLines(content)
  if (startDefined && !endDefined) {
    return lines.slice(startLine - 1, startLine).join('')
  }
  // @ts-ignore
  if (startLine && endLine && Number(startLine) <= Number(endLine)) {
    return lines.slice(startLine - 1, endLine).join('\n')
  }
}

/**
 * Check if string is uppercase
 * @param {string} str - Input string
 * @returns {boolean} True if uppercase
 */
function isUpperCase(str) {
  return str === str.toUpperCase()
}

// https://github.com/jamiebuilds/min-indent/blob/master/index.js
/**
 * Find minimum indentation in string
 * @param {string} string - Input string
 * @returns {number} Minimum indentation level
 */
function findMinIndent(string) {
	const match = string.match(/^[ \t]*(?=\S)/gm)
	if (!match) return 0
	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

/**
 * Strip indentation from string
 * @param {string} string - Input string
 * @param {number} [indentation] - Indentation level to strip
 * @returns {string} String with indentation stripped
 */
function stripIndent(string, indentation) {
  const indent = typeof indentation !== 'undefined' ? indentation : findMinIndent(string);
	if (indent === 0) {
		return string
	}
	const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm')
	return string.replace(regex, '')
}

/**
 * Trim leading & trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
 * @param {string|number} str 
 * @returns {string}
 */
 function trimString(str = '') {
  let content = (typeof str === 'number') ? str.toString() : str
  // console.log('content', `"${content}"`)
  return content.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')
}

/**
 * Add indentation to string
 * @param {string} string - Input string
 * @param {number} [count=1] - Number of indentations to add
 * @param {object} [options={}] - Options for indentation
 * @param {string} [options.indent=' '] - Character(s) to use for indentation
 * @param {boolean} [options.includeEmptyLines=false] - Whether to indent empty lines
 * @returns {string} Indented string
 */
function indentString(string, count = 1, options = {}) {
	const {
		indent = ' ',
		includeEmptyLines = false
	} = options;
	if (count === 0) return string
	// const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm
  const indentPattern = indent.repeat(count)
  const regex = includeEmptyLines
    ? new RegExp(`^(?!${indentPattern})`, 'gm')
    : new RegExp(`^(?!${indentPattern})(?!\\s*$)`, 'gm')
	return string.replace(regex, indent.repeat(count))
}

/**
 * Removes the indentation of multiline strings
 * @link https://github.com/victornpb/tiny-dedent/
 * @param {string} str - A template literal string
 * @returns {string} A string without the indentation
 */
function dedentString(str) {
  str = str.replace(/^[ \t]*\r?\n/, ''); // remove leading blank line
  var indent = /^[ \t]+/m.exec(str); // detected indent
  if (indent) str = str.replace(new RegExp('^' + indent[0], 'gm'), ''); // remove indent
  return str.replace(/(\r?\n)[ \t]+$/, '$1'); // remove trailing blank line
}

/**
 * Strip out comment blocks
 * @param {string} str 
 * @param {'md' | 'js'} syntax 
 * @returns {string} clean comment-less string
 */
function stripCommentBlockOld(str, syntax = 'md') {
  const [ openPattern, closePattern ] = syntaxMap[syntax].pattern
  const pattern = new RegExp(`^([ \\S]*)${openPattern}(\\s?[\\s\\S]*?)?${closePattern}\n?`, 'gim')
  // console.log('pattern', pattern)
  let newString = str
  let matches
  while ((matches = pattern.exec(str)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ _match, leadingText ] = matches
    /*
    console.log('_match', _match)
    console.log('leadingText', `"${leadingText}"`)
    console.log('───────────────────────')
    /**/
    /* Handle comments that start midway through line after text */
    if (leadingText) {
      /* Trim trailing tabs/spaces */
      const trimmed = leadingText.replace(/([ \t]*)$/, '')
      const replacement = _match.replace(trimmed, '')
      // console.log('replacement', `"${replacement}"`)
      newString = newString.replace(replacement, `\n`)
      // console.log('new str', newString)
    }
  }

  // const pattern = new RegExp(`([ \\t]*)${openPattern}\\s?([\\s\\S]*?)?${closePattern}\n?`, 'gi')
  return newString.replace(pattern, '')
}

/**
 * Strip out comment blocks
 * @param {string} str 
 * @param {import('../types').SyntaxType} syntax 
 * @returns {string} clean comment-less string
 */
function stripComments(str, syntax = 'md') {
  const syntaxData = syntaxMap[syntax]
  const [ openPattern, closePattern ] = syntaxData.pattern
  const OR = (syntaxData.singleLine) ? `|\\s?[ \\t]*${syntaxData.singleLine}` : ''
  const CONTENT = syntaxData.content || '[\\s\\S]*?'
  
  // Handle multi-line comments
  const multiLinePattern = new RegExp(`\\s?[ \\t]*${openPattern}${CONTENT}${closePattern}`, 'gim')
  let result = str.replace(multiLinePattern, '')
  
  // Handle single-line comments if they exist
  if (syntaxData.singleLine) {
    const singleLinePattern = new RegExp(`\\s?[ \\t]*${syntaxData.singleLine}.*$`, 'gm')
    result = result.replace(singleLinePattern, '')
  }
  
  return result
}


// https://regex101.com/r/nCnt2J/1
function stripMultiLineDoubleSlashComments(str = '') {
  return str.replace(/(?:\n\s*\/\/.*){2,}/g, '')
}

function stripSingleLineDoubleSlashComments(str = '') {
  return str.replace(/\/\/.*$/gm, '')
}

// https://regex101.com/r/plpXmr/1
function stripOutMultilineJsComments(str = '') {
  return str.replace(/\/\*[\s\S]+?\*\/\s*\n?/g, (match) => {
    return match.trim().includes('\n') ? '' : match
  })
}


// @TODO export as util to import into CODE
function stripHTMLComments(block, opts) {
  const options = opts || {}
  // ([^\s]*)?([ \t]*)?(\/\*{1,}[\n\*]*(\s?[\s\S]*?)?\*\/)([^\s<]*)?(\n{1,2})?
  // https://regex101.com/r/WSioZ7/1
  const pattern = new RegExp(`([^\\s]*)?([ \\t]*)?(<!-{2,}(\\s?[\\s\\S]*?)?-{2,}>)([^\\s<]*)?(\n{1,2})?`, 'gi')
  // ALT https://regex101.com/r/hxppia/1
  // Alt HTML comments https://regex101.com/r/EJyioz/1

  // console.log('closeTagRegex', closeTagRegex)
  let matches
  let remove = []
  while ((matches = pattern.exec(block)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, leadingText, leadingSpace, comment, insideComment, trailingText, trailingNewLine ] = matches
    /*
    console.log('match', match)
    console.log('leadingText', leadingText)
    console.log('leadingSpace', leadingSpace)
    console.log('comment', comment)
    console.log('insideComment', insideComment)
    console.log('trailingText', trailingText)
    console.log('trailingNewLine', trailingNewLine)
    /** */
    const newLineCount = (trailingNewLine || '').length
    const trailing = (!trailingText && !leadingText && newLineCount >= 1) ? `${trailingNewLine || ''}` : ''
    let leading = (leadingSpace) ? leadingSpace : ''

    if (options.multilineOnly && comment.indexOf('\n') === -1) {
      continue
    }
    remove.push(`${leading}${comment}${trailing}`)
  }
  return remove.reduce((acc, curr) => {
    return acc.replaceAll(curr, '')
  }, block)
}

function convertCommentSyntax(str, { from, to }) {
  const syntaxData = syntaxMap[from]
  const [ openPattern, closePattern ] = syntaxData.pattern
  const [ openTag, closeTag ] = syntaxMap[to].tags
  // const match = ` *?\\${openPattern}([\\s\\S]*?)?${closePattern}\\n\\n*?`
  const UseLeadingLine = ''// || '|\\s?[ \\t]*'
  const OR = (syntaxData.singleLine) ? `|${UseLeadingLine}${syntaxData.singleLine}` : ''
  const CONTENT = syntaxData.content || '[\\s\\S]*?'
  const match = `${UseLeadingLine}${openPattern}(${CONTENT})?${closePattern}${OR}`
  // const match = `${openPattern}(.*|\\r?|\\n?|\\s*)*${closePattern}`
  const regexToUse = new RegExp(match, 'gm')
  // console.log('regexToUse', regexToUse)
  const found = str.match(regexToUse)
  // console.log('found', found)
  if (!found) {
    return str
  }

  const pattern = syntaxData.singleLinePattern ? new RegExp(syntaxData.singleLinePattern) : new RegExp(openPattern)
  // console.log('pattern', pattern)
  for (let index = 0; index < found.length; index++) {
    const comment = found[index]
    const cleanComment = comment.replace(pattern, '')
    /*
    console.log('comment', comment)
    console.log('cleanComment', cleanComment)
    /** */
    str = str.replace(comment, `${openTag}${cleanComment} ${closeTag}`)
  }
  return str

  const newComment = found[0].replace(regexToUse, `${openTag}$1${closeTag}`)
  const converter = syntaxMap[to].converter
  const newText = (converter) ? converter(newComment) : newComment
  return str.replace(regexToUse, newText)
}

/**
 * Capitalize first letter
 * @param {string} str - Input string
 * @returns {string} String with first letter capitalized
 */
function capitalizeFirstLetter(str) {
  return capitalize(str.charAt(0)) + str.slice(1)
}

/**
 * Capitalize string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalize(str = '') {
  return str.toUpperCase()
}

/**
 * Convert string to camelCase
 * @param {string} str - Input string
 * @returns {string} camelCase string
 */
function camelCase(str = '') {
  return str.replace(/[-_ ](\w)/g, (_, c) => c.toUpperCase())
}

/**
 * Convert string to kebab-case
 * @param {string} str - Input string
 * @returns {string} kebab-case string
 */
function kebabCase(str = '') {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}

const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} Title Case string
 */
function toTitleCase(str = '') {
	return str.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, (match, index, title) => {
		if (index > 0
			&& index + match.length !== title.length
			&& match.search(smallWords) > -1
			&& title.charAt(index - 2) !== ':'
			&& (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-')
			&& title.charAt(index - 1).search(/[^\s-]/) < 0) {
			return match.toLowerCase();
		}

		if (match.substr(1).search(/[A-Z]|\../) > -1) {
			return match;
		}

		return match.charAt(0).toUpperCase() + match.substr(1);
	})
}

module.exports = {
  toTitleCase,
  getLines,
  getLineCount,
  getWordCount,
  getLeadingSpaces,
  getFirstCharacter,
  getLastCharacter,
  getRowAndColumnFromCharPos,
  getTextBetweenChars,
  getTextBetweenWords,
  getTextBetweenLines,
  replaceTextBetweenChars,
  stripIndent,
  indentString,
  dedentString,
  stripComments,
  convertCommentSyntax,
  stripSingleLineDoubleSlashComments,
  stripMultiLineDoubleSlashComments,
  stripHTMLComments,
  // stripCommentBlockJS,
  trimString,
  // future https://github.com/junfengliang/autowrap
  findMinIndent,
  isUpperCase
}