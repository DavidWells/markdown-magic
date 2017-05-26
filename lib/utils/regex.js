"use strict" // eslint-disable-line
/*eslint-disable */
module.exports.matchCommentBlock = function(matchWord) {
  return new RegExp(`(?:\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START(?:.|\\r?\\n)*?\\()(.*)\\)(?:.|\\r?\\n)*?<!--(?:.|\\r?\\n)*?${matchWord}:END(?:.|\\r?\\n)*?--\\>`, 'g')
}

module.exports.matchOpeningCommentTag = function (matchWord) {
  return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
}

module.exports.matchClosingCommentTag = function (matchWord) {
  return new RegExp(`((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${matchWord}:END)((?:.|\\r?\\n)*?--\\>)`, 'g')
}
