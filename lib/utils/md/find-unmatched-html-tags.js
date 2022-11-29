const { getLineNumberFromMatch } = require('./utils')
// const { voidTags } = require('../html-to-json/tags')

// https://regex101.com/r/he9l06/2
// http://xahlee.info/js/html5_non-closing_tag.html
// voidTags
const CLOSE_TAG_REGEX = /<(br|hr|img|embed|col|link|meta)(([^>]*)([^/])(>)|>)/g

function findUnmatchedHtmlTags(block, filePath) {
  let matches
  let errors = []
  const msg = (filePath) ? ` in ${filePath}` : ''
  while ((matches = CLOSE_TAG_REGEX.exec(block)) !== null) {
    if (matches.index === CLOSE_TAG_REGEX.lastIndex) {
      CLOSE_TAG_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    // console.log(matches)
    const [ _, tag, insideOrEnd ] = matches
    const lineNumber = getLineNumberFromMatch(block, matches)
    const fixed = (insideOrEnd === '>') ? '/>' : `${insideOrEnd.substring(0, insideOrEnd.length - 1)}/>`
    errors.push({
      message: `Unclosing HTML tag on line ${lineNumber}${msg}.\n    Need closing tag "/>" on:   \n${_}`,
      brokenTag: _,
      correctUsage: `<${tag}${fixed}`
    })
  }
  return errors
}

module.exports = {
  findUnmatchedHtmlTags,
  CLOSE_TAG_REGEX
}
