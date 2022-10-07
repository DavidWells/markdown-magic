

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

function indentString(string, count = 1, options = {}) {
	const {
		indent = ' ',
		includeEmptyLines = false
	} = options;
	if (count === 0) return string
	const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm
	return string.replace(regex, indent.repeat(count))
}

module.exports = {
  getLines,
  getLineCount,
  getWordCount,
  getLeadingSpaces,
  getFirstCharacter,
  getLastCharacter,
  getRowAndColumnFromCharPos,
  getTextBetweenChars,
  getTextBetweenLines,
  replaceTextBetweenChars,
  stripIndent,
  indentString,
  findMinIndent,
  isUpperCase
}