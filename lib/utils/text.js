const { syntaxMap } = require('./syntax')

function getLines(str = '') {
  return str.split(/\r\n|\r|\n/)
}

function getLineCount(str = '') {
  return getLines(str).length
}

function getRowAndColumnFromCharPos(input, indexToFind) {
  const preChunk = input.substr(0, indexToFind);
  const row = preChunk.split('\n').length - 1
  const lastIndexOfNewLine = input.lastIndexOf('\n', indexToFind);
  const col = lastIndexOfNewLine > 0 ? indexToFind - lastIndexOfNewLine - 1 : indexToFind;
  return { row, col }
};

function getWordCount(str = '') {
  return str.trim().split(/\s+/).length
}

function getFirstCharacter(str) {
  return str.charAt(0)
}

function getLastCharacter(str) {
  return str.substr(-1)
}

function getLeadingSpaces(text) {
  const matches = text.match(/^\s*/)
  return (matches && matches[0]) ? matches[0] : ''
}

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

function replaceTextBetweenChars(str = '', start, end, newStr) {
  return str.substring(0, start) + newStr + str.substring(end)
}

function getTextBetweenLines(content, startLine, endLine) {
  const startDefined = typeof startLine !== 'undefined'
  const endDefined = typeof endLine !== 'undefined'
  if (!startDefined && !endDefined) return

  const lines = getLines(content)
  if (startDefined && !endDefined) {
    return lines.slice(startLine - 1, startLine).join('')
  }
  if ((startLine) && (endLine) && parseInt(startLine, 10) <= parseInt(endLine, 10)) {
    return lines.slice(startLine - 1, endLine).join('\n')
  }
}

function isUpperCase(str) {
  return str === str.toUpperCase()
}

// https://github.com/jamiebuilds/min-indent/blob/master/index.js
function findMinIndent(string) {
	const match = string.match(/^[ \t]*(?=\S)/gm)
	if (!match) return 0
	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

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
 * @returns string
 */
 function trimString(str = '') {
  let content = (typeof str === 'number') ? str.toString() : str
  // console.log('content', `"${content}"`)
  return content.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')
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

/**
 * Removes the indentation of multiline strings
 * @link https://github.com/victornpb/tiny-dedent/
 * @param  {string} str A template literal string
 * @return {string} A string without the indentation
 */
function dedentString(str) {
  str = str.replace(/^[ \t]*\r?\n/, ''); // remove leading blank line
  var indent = /^[ \t]+/m.exec(str); // detected indent
  if (indent) str = str.replace(new RegExp('^' + indent[0], 'gm'), ''); // remove indent
  return str.replace(/(\r?\n)[ \t]+$/, '$1'); // remove trailling blank line
}

/**
 * Strip out comment blocks
 * @param {string} str 
 * @param {'md' | 'js'} syntax 
 * @returns {string} clean commentless string
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
 * @param {typeof import('../types')['syntaxType']} syntax 
 * @returns {string} clean commentless string
 */
function stripComments(str, syntax = 'md') {
  const syntaxData = syntaxMap[syntax]
  const [ openPattern, closePattern ] = syntaxData.pattern
  const OR = (syntaxData.singleLine) ? `|\\s?[ \\t]*${syntaxData.singleLine}` : ''
  const CONTENT = syntaxData.content || '[\\s\\S]*?'
  const pattern = new RegExp(`\\s?[ \\t]*${openPattern}(${CONTENT})?${closePattern}${OR}`, 'gim')
  console.log('pattern', pattern)
  return str.replace(pattern, '')
  // https://regex101.com/r/XKHU18/5
  return str.replace(/\s?[ \t]*\/\*[\s\S]*?\*\/|\s?[ \t]*\/\/.*$|\/\*{1,}[\n\*]*(\s?[\s\S]*?)?\*+\//gm, '')
}

// @TODO export as util to import into CODE
function stripAllComments(block) {
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
    const trailing = (!trailingText && newLineCount > 1) ? `${trailingNewLine || ''}` : ''
    const leading = (leadingSpace) ? leadingSpace.slice(1) : ''
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
 * capitalize first letter
 * @param {string} str 
 * @returns 
 */
function capitalizeFirstLetter(str) {
  return capitalize(str.charAt(0)) + str.slice(1)
}

/**
 * capitalize string
 * @param {string} str 
 * @returns 
 */
function capitalize(str = '') {
  return str.toUpperCase()
}

function camelCase(str = '') {
  return str.replace(/[-_ ](\w)/g, (_, c) => c.toUpperCase())
}

function kebabCase(str = '') {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}

const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;

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
  // stripCommentBlockJS,
  trimString,
  // future https://github.com/junfengliang/autowrap
  findMinIndent,
  isUpperCase
}