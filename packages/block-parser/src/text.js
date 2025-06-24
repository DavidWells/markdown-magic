function getTextBetweenChars(text, start, end) {
  return text.slice(start, end)
}

// https://github.com/jamiebuilds/min-indent/blob/master/index.js
function findMinIndent(string) {
	const match = string.match(/^[ \t]*(?=\S)/gm)
	if (!match) return 0
	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

/**
 * Removes the indentation of multiline strings
 * @link https://github.com/victornpb/tiny-dedent/
 * @param {string} str - A template literal string
 * @returns {string} A string without the indentation
 */
function dedentStringBasic(str) {
  str = str.replace(/^[ \t]*\r?\n/, ''); // remove leading blank line
  var indent = /^[ \t]+/m.exec(str); // detected indent
  if (indent) str = str.replace(new RegExp('^' + indent[0], 'gm'), ''); // remove indent
  return str.replace(/(\r?\n)[ \t]+$/, '$1'); // remove trailing blank line
}


/**
 * Removes the indentation of multiline strings
 * @param {string} text - A template literal string
 * @returns {{ minIndent: number, text: string }} A string without the indentation
 */
function dedentString(text) {
  if (!text) return { minIndent: 0, text: '' }
  const lines = text.split('\n')
  let minIndent = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue
    let indent = 0
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) indent++
    if (minIndent === null || indent < minIndent) minIndent = indent
  }
  if (minIndent === null) return { minIndent: 0, text: text.trim() }
  
  let result = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let leading = 0
    while (leading < line.length && (line[leading] === ' ' || line[leading] === '\t')) leading++
    const toRemove = Math.min(leading, minIndent)
    result += line.slice(toRemove) + '\n'
  }
  result = result.slice(0, -1) // Remove trailing newline
  const cleanResult = result.replace(/^[\r\n]+|[\r\n]+$/g, '')
  return { minIndent, text: cleanResult }
}

module.exports = {
  getTextBetweenChars,
  findMinIndent,
  dedentString,
}