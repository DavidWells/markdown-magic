/*eslint-disable */

module.exports.matchCommentBlock = function(matchWord) {
  return new RegExp(`(?:\\<\\!--(?:.|\\n)*?${matchWord}:START(?:.|\\n)*?\\()(.*)\\)(?:.|\\n)*?<!--(?:.|\\n)*?${matchWord}:END(?:.|\\n)*?--\\>`, 'g')
}

module.exports.matchOpeningCommentTag = function (matchWord) {
  return new RegExp(`(\\<\\!--(?:.|\\n)*?${matchWord}:START)((?:.|\\n)*?--\\>)`, 'g')
}

module.exports.matchClosingCommentTag = function (matchWord) {
  return new RegExp(`((?:\\<\\!--(?:.*|\\n)(?:.*|\\n))*?${matchWord}:END)((?:.|\\n)*?--\\>)`, 'g')
}
