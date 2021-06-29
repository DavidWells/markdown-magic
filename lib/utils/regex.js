"use strict" // eslint-disable-line
/*eslint-disable */
module.exports.matchCommentBlock = function(matchWord) {
  //return new RegExp(`(?:\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START(?:.|\\r?\\n)*?\\()(.*)\\)(?:.|\\r?\\n)*?<!--(?:.|\\r?\\n)*?${matchWord}:END(?:.|\\r?\\n)*?--\\>`, 'g')
  return new RegExp(`(.*)(?:\\<\\!--(?:.*|\r?|\n?|\s*)${matchWord}:START(?:.|\\r?\\n)*?\\()(.*)\\)(?:.|\\r?\\n)*?<!--(?:.*|\r?|\n?|\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`, 'g')
}

module.exports.matchOpeningCommentTag = function (matchWord) {
  // return new RegExp(`(\\<\\!--(?:.|\\r?\\n)*?${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
  return new RegExp(`(\\<\\!--(?:.*|\r?|\n?|\s*)${matchWord}:START)((?:.|\\r?\\n)*?--\\>)`, 'g')
}

module.exports.matchClosingCommentTag = function (matchWord) {
  return new RegExp(`--\\>(?:.|\\r?\\n)*?((?:\\<\\!--(?:.*|\\r?\\n)(?:.*|\\r?\\n))*?${matchWord}:END)((?:.|\\r?\\n)*?--\\>)`, 'g')
}

// Regex to remove all comment blocks
const removeCommentsREGEX = / *?\<\!-- ([\s\S]*?) ?--\>\n\n*?/g
// content.replace(removeComments, '')


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