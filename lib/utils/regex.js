/*eslint-disable */

module.exports.matchOpeningCommentTag = function (matchWord) {
  return new RegExp(`(\\<\\!--(?:.|\\n)*?${matchWord}:START)((?:.|\\n)*?--\\>)`, 'g')
}

module.exports.matchClosingCommentTag = function (matchWord) {
  return new RegExp(`((?:\\<\\!--(?:.*|\\n)(?:.*|\\n))*?${matchWord}:END)((?:.|\\n)*?--\\>)`, 'g')
}
