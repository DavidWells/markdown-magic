

function getLineNumberFromMatch(text = '', matches) {
  return getLineCount(text.substr(0, matches.index))
}

function getLines(str = '') {
  return str.split(/\r\n|\r|\n/)
}

function getLineCount(str = '') {
  return getLines(str).length
}

module.exports = {
  getLines,
  getLineCount,
  getLineNumberFromMatch
}