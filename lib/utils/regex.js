
module.exports.matchCommentBlock = function(word) {
  //return new RegExp(`(?:\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START(?:.|\\r?\\n)*?\\()(.*)\\)(?:.|\\r?\\n)*?<!--(?:.|\\r?\\n)*?${matchWord}:END(?:.|\\r?\\n)*?--\\>`, 'g')
  return new RegExp(`(.*)(?:\\<\\!--(?:.*|\r?|\n?|\s*)${word}:START(?:.|\\r?\\n)*?\\()(.*)\\)(?:.|\\r?\\n)*?<!--(?:.*|\r?|\n?|\s*)${word}:END(?:.|\\r?\\n)*?--\\>`, 'g')
}

module.exports.matchOpeningCommentTag = function (word) {
  // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
  return new RegExp(`(\\<\\!--(?:.*|\r?|\n?|\s*)${word}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
}

module.exports.matchClosingCommentTag = function (word) {
  return new RegExp(`--\\>(?:.|\\r?\\n)*?((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${word}:END)((?:.|\\r?\\n)*?--\\>)`, 'g')
}

module.exports.removeLeadingAndTrailingLineBreaks = /^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g

const jsRegex = /\/\* Step([\s\S]*?)\*\//g
const ymlRegex = / *?# Step([\s\S]*?) #\n*?/g
const htmlRegex = / *?\<\!-- Step([\s\S]*?) ?--\>\n*?/

function cleanStepMatches(matches) {
  return matches.map((m) => {
    return m
      .replace(/^\s+|\s+$/g, '')
      .replace(/\/\*/g, '') // remove js comments
      .replace(/\*\//g, '') // remove js comments
      .replace(/^#/g, '') // remove # comments
      .replace(/#$/g, '') // remove # comments
      .replace(/^\<\!--/g, '') // remove html comments
      .replace(/--\>$/g, '') // remove html comments
      .replace(/^\s+|\s+$/g, '')
      // .replace(/^!$/g,'') // remove trailing !
      .replace(/\n#\s+/g, '\n')
      .replace(/^Step\s+/g, '')
  })
}

/**
 * Match comment steps in files
 */
function getSteps() {
  const steps = cleanStepMatches(matches)

  const sortedSteps = steps.reduce((accumulator, currentValue, currentIndex, array) => {
    const number = currentValue.match(/^[0-9]{1,3}/)[0]
    accumulator[currentIndex] = {
      step: parseInt(number, 10),
      value: currentValue
    }
    return accumulator
  }, []).sort((a, b) => {
    return a.step - b.step
  }).map((item) => {
    return item.value
  })
}

// Regex to remove all comment blocks
const REMOVE_COMMENTS_REGEX = / *?\<\!-- ([\s\S]*?) ?--\>\n\n*?/g
// content.replace(removeComments, '')

// https://github.com/vendia/blog/commit/0c231fa928423ab050fbdb8d308eaa905b553aff
const HIDDEN_FRONTMATTER_REGEX = /^<!--.*((.|\r?\n)*?.*-->)/g
const FRONTMATTER_REGEX = /^---.*((.|\r?\n)*?.*---)/g

const LEADING_NEW_LINE_REGEX = /^(\r?\n|\r)/
const SQUARE_BRACKETS_REGEX = /^\[(\\.|[^\]])+\]/
const TABEL_ROW_REGEX = /^\s*\|.*?\|\s*$/
/**
 * Validates whether a text is Markdown table row (starts and ends with a pipe).
 *
 * @param {string} text  The text to validate.
 * @returns {boolean}
 */
const isTableRow = (text) => text.match(TABEL_ROW_REGEX);