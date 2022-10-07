const { parseJSON } = require('json-alexander')

// alt approach maybe https://github.com/etienne-dldc/literal-parser
const RESERVED = '__private'
const SPACES = '__SPACE__'
const BREAK = '__OPT_BREAK__'
const SURROUNDING_QUOTES = /^("|')|("|')$/g
const STARTS_WITH_VALID_CHAR = /^[A-Za-z0-9_]/

function convert(value) {
  if (value === 'false') {
    return false
  }
  if (value === 'true') {
    return true
  }

  const isNumber = Number(value)
  if (typeof isNumber === 'number' && !isNaN(isNumber)) {
    return isNumber
  }

  // console.log(typeof value)
  // console.log('convert preparse value', value)
  try {
    const val = parseJSON(value) // last attempt to format an array like [ one, two ]
    // console.log('parseJSON val', val)
    // if (typeof val === 'string' && val.match(/^\[/) && val.match(/\]$/)) {
    //   const inner = val.match(/^\[(.*)\]/)
    //   if (inner && inner[1]) {
    //     const newVal = inner[1].split(', ').map((x) => {
    //       return convert(x.trim())
    //     })
    //     return newVal
    //   }
    // }
    return val
  } catch (err) {
    // console.log('parse error', err)
    // console.log('json val', value)
    /* Convert array looking string into values */
    if (typeof value === 'string' && value.match(/^\[/) && value.match(/\]$/)) {
      const inner = value.match(/^\[(.*)\]/)
      if (inner && inner[1]) {
        const composeValue = inner[1].split(',').reduce((acc, curr) => {
          const open = (curr.match(/{/g) || []).length
          const close = (curr.match(/}/g) || []).length
          const arrayOpen = (curr.match(/\[/g) || []).length
          const arrayClose = (curr.match(/\]/g) || []).length
          acc.objectOpenCount += open
          acc.objectCloseCount += close
          acc.arrayOpenCount += arrayOpen
          acc.arrayCloseCount += arrayClose
          const sealObject = acc.objectOpenCount > 0 && acc.objectOpenCount === acc.objectCloseCount
          const sealArray = acc.arrayOpenCount > 0 && acc.arrayOpenCount === acc.arrayCloseCount

          if (acc.objectOpenCount > 0 && !sealObject || acc.arrayOpenCount > 0 && !sealArray) {
          // if (curr.match(/:|{/)) {
            return {
              ...acc,
              next: acc.next + curr + ','
            }
          }

          if (sealObject || sealArray) {
            return {
              ...acc,
              ...(!sealObject) ? {} : {
                objectOpenCount: 0,
                objectCloseCount: 0,
              },
              ...(!sealArray) ? {} : {
                arrayOpenCount: 0,
                arrayCloseCount: 0,
              },
              next: '',
              values: acc.values.concat(acc.next + curr)
            }
          }

          // default
          return {
            ...acc,
            values: acc.values.concat(curr)
          }
        }, {
          next: '',
          values: [],
          arrayOpenCount: 0,
          arrayCloseCount: 0,
          objectOpenCount: 0,
          objectCloseCount: 0,
        })
        // console.log('composeValue', composeValue)
        if (composeValue.values.length) {
          const newVal = composeValue.values.map((x) => {
            // console.log('x', x)
            return convert(x.trim())
          })
          return newVal
        }
      }
    }
    /* Fix fallthrough strings remove surrounding strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.replace(/^"|"$/g, '')
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.replace(/^'|'$/g, '')
    }
    */
  }
  return value
}


function fixSpaceStrings(val) {
  if (typeof val === 'string') {
    return val.replace(/__SPACE__/g, ' ')
  }
  return val
}

function optionsParse(x) {
  if (typeof x === 'undefined' || x === null ||  x === '') {
    return {}
  }
  // https://regex101.com/r/bx8DXm/1/ Match everything but spaces/newlines
  // var pattern = /("|'|{)[^"}]+("|'|})|(\S+)/g
  var pattern = /(\S+)/g

  //var y = /("|{)[^"}]+("|})|([^\r\n\t\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+)/gm
  
  const cleanLines = x
    // Remove JS comment blocks and single line comments https://regex101.com/r/XKHU18/2
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    // bob="co ol" steve="c ool" --> add temp spaces
    .replace(/\s+(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, SPACES)
    // bob='co ol' steve='c ool' --> add temp spaces
    .replace(/\s+(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, SPACES)
    // .replace(/ /g, SPACES)
    // matchspaces inside quotes https://regex101.com/r/DqJ4TD/1
    // .replace(/\s+(?=(?:(?:[^"']*(?:"|')){2})*[^"']*(?:"|')[^"']*$)/g, SPACES)
    .split(/\n/)
    .filter((line) => {
      /* Trim single line comments like:
        // xyz
        ## abc
        /* foo bar * /  
      */
      return !line.trim().match(/^(\/\/+|\/\*+|#+)/gm)
    })
    // .map((x) => x.trim().replace(/ /g, SPACES)) // c="tons of" weird inner quotes"
    .join('\n')
    //.replace(/ /g, SPACES)
  // console.log('cleanLines', cleanLines)

  var lines = cleanLines
    .replace(/__SPACE__([a-zA-Z]*)=/g, `${BREAK}$1=`)
    .match(pattern)
    .map(fixSpaceStrings)
    /* if BREAK split string again */
    .map((item) => {
      return item.split(BREAK)
    }).flat()

  // console.log('lines', lines)
  var isEnding = /(['"}\]]|true,?|false,?)$/
  var isKeyValNoQuotes = /^[A-Za-z]+=[A-Za-z0-9!*_\-\/\\]/
  //var isKeyValNoQuotes = /^[A-Za-z]+=\S+/

  // @TODO Get real json matcher 
  var isJsonLike = /[{[]/

  const values = lines.reduce((acc, curr, i) => {
    let alreadyAdded = false
    const isLastLoop = lines.length === (i + 1)
    const nextItem = lines[i + 1] || '' 

    const hasText = curr.match(STARTS_WITH_VALID_CHAR)
    /*
    console.log('___________________')
    console.log('isLastLoop', isLastLoop)
    console.log('RESERVED', acc[RESERVED]) 
    console.log("current item", `|${curr}|`) 
    console.log('next item   ', `|${nextItem}|`) 
    console.log('===================')
    /** */

    // If has no = its a true boolean. e.g isThingy
    if (hasText && acc[RESERVED].match(STARTS_WITH_VALID_CHAR) && !isValuePair(acc[RESERVED])) {
      // console.log('xxxxxxx', acc[RESERVED])
      acc[trimTrailingComma(acc[RESERVED])] = true
      acc[RESERVED] = ''
    }
    // If has no = its a true boolean
    if (
        hasText
        && !curr.match(isEnding) 
        && acc[RESERVED].match(isEnding) 
        && !acc[RESERVED].match(isJsonLike)
      ) {
      // console.log('end', curr)
      // console.log('acc[RESERVED]', acc[RESERVED])
      const kv = getKeyAndValueFromString(acc[RESERVED], 'boolean')
      if (kv) {
        acc[kv.key] = kv.value
      }
      acc[RESERVED] = ''
    }

    if (!acc[RESERVED].match(/^[A-Za-z]+={+/) && isValuePair(curr) && curr.match(isEnding)) {
      const kv = getKeyAndValueFromString(curr, 'one')
      // console.log('kv', kv)
      if (kv) {
        // console.log(`ADDED`, kv)
        acc[kv.key] = kv.value
      }
    } else if (curr.match(isKeyValNoQuotes)) {
      const kv = getKeyAndValueFromString(curr, 'curr.match(isKeyValNoQuotes)')
      // console.log('no quotes')
      if (kv) {
        acc[kv.key] = kv.value
      }
    } else {
      const updated = acc[RESERVED] + curr
      // console.log('SET reserve', `"${updated}"`)
      if (!updated.match(isEnding) && updated.match(isKeyValNoQuotes)) {
        // console.log('UPDATED HERE', updated)
        const kv = getKeyAndValueFromString(updated, 'fall')
        if (kv) {
          acc[kv.key] = kv.value
          acc[RESERVED] = ''
        }
      } else {
        alreadyAdded = true
        acc[RESERVED] = updated
      }
    }
    
    if (
      acc[RESERVED].match(isEnding) 
      && nextItem.match(/^[A-Za-z0-9_-]/) 
      && isBalanced(acc[RESERVED]) // If value is balanced brackets {[()]}
    ) {
      const kv = getKeyAndValueFromString(acc[RESERVED], 'xxxx')
      if (kv) {
        // console.log(`acc[RESERVED].match(isEnding)`, kv)
        acc[kv.key] = kv.value
      }
      acc[RESERVED] = ''
    }

    // If ends in number foo=2 or bar=3, but ignore foo=[2 and foo=[{2
    if (isValuePair(curr) && curr.match(/\d,?$/) && !curr.match(/=\{?\[/)) {
      const kv = getKeyAndValueFromString(acc[RESERVED], 'numberMatch')
      if (kv) {
        // console.log(`acc[RESERVED].match(isEnding)`, kv)
        acc[kv.key] = kv.value
      }
      acc[RESERVED] = ''
    }

    // If last loop and still no match and looks like KV. Parse it
    if (isLastLoop) {
      // If single isCool boolean
      if (hasText && !curr.match(/=/)) {
        // console.log(`ADDED`, kv)
        // acc[curr] = true
        // acc[RESERVED] = ''
      }
      // console.log('currrrrr', curr)
      // console.log("acc[RESERVED]", acc[RESERVED])
      // console.log('combined', acc[RESERVED] + curr)
      // If value empty but __private have accumulated values
      if (acc[RESERVED]) {
      // if (acc[RESERVED] && (acc[RESERVED].match(isEnding) || isValuePair(acc[RESERVED]))) {
        const valueToCheck = (curr.match(isEnding) && !alreadyAdded) ? acc[RESERVED] + curr : acc[RESERVED]
        // console.log('valueToCheck', valueToCheck)
        const kv = getKeyAndValueFromString(valueToCheck, 'lastLoop')
        if (kv) {
          // console.log(`acc[RESERVED].match(isEnding)`, kv)
          acc[kv.key] = kv.value
        }
        acc[RESERVED] = ''
      }
    }

    return acc
  }, {
    [RESERVED]: '',
  })

  // console.log('values', values)

  delete values[RESERVED]

  /* // If no keys last attempt to parse
  if (!Object.keys(values).length) {
    const kv = getKeyAndValueFromString(x)
    if (kv) {
      return {  
        [`${kv.key}`]: kv.value
      }
    }
  }
  */

  return values
}

function isValuePair(str) {
  return str.match(/=/) // && !str.match(/=\[/)
}

// https://melvingeorge.me/blog/check-if-string-contain-emojis-javascript OR https://www.npmjs.com/package/emoji-regex
function hasEmoji(str) {
  const regexExp = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
  return regexExp.test(str)
}

/**
 * Verify brackets are balanced
 * @param  {string}  str - string with code
 * @return {Boolean}
 */
 function isBalanced(str) {
  return !str.split('').reduce((uptoPrevChar, thisChar) => {
    if (thisChar === '(' || thisChar === '{' || thisChar === '[') {
      return ++uptoPrevChar
    } else if (thisChar === ')' || thisChar === '}' || thisChar === ']') {
      return --uptoPrevChar
    }
    return uptoPrevChar
  }, 0)
}

function getKeyAndValueFromString(string, from) {
  //console.log(`getKeyAndValueFromString from ${from}`)
  // console.log(`|${string}|`)
  if (!string) return
  // const keyValueRegex = /([A-Za-z-_$]+)=['{"]?(.*)['}"]?/g
  // const match = keyValueRegex.exec(string)
  // if (!match) {
  //   return
  // }
  // console.log('getKeyAndValueFromString')
  const [key] = string.split('=')
  /* If no key or key starts with --- */
  if (!key || key.charAt(0) === '-' || hasEmoji(key)) {
    return
  }
  // console.log('string', string)
  // console.log('key', key)
  // console.log('values', values)
  /* If no value, isThing === true */
  const hasEqual = string.indexOf('=') > -1
  if (!hasEqual) {
    return {
      key: key,
      value: true,
    }
  }

  let value = string.substring(string.indexOf('=') + 1)
    // Trim trailing commas
    .replace(/,$/, '')
  //console.log('value', value)
 
  const leadingCurleyBrackets = value.match(/^{{2,}/)
  const trailingCurleyBrackets = value.match(/}{2,}$/)
  if (leadingCurleyBrackets && trailingCurleyBrackets) {
    const len = leadingCurleyBrackets[0].length <= trailingCurleyBrackets[0].length ? leadingCurleyBrackets : trailingCurleyBrackets
    const trimLength = len[0].length
    const trimLeading = new RegExp(`^{{${trimLength}}`)
    const trimTrailing = new RegExp(`}{${trimLength}}$`)
    if (trimLength) {
      value = value
        // Trim extra leading brackets
        .replace(trimLeading, '{')
        // Trim extra trailing brackets
        .replace(trimTrailing, '}')
    }
  }

  const surroundingQuotes = value.match(SURROUNDING_QUOTES) || []
  const hasSurroundingQuotes = surroundingQuotes.length === 2 && (surroundingQuotes[0] === surroundingQuotes[1])
  // console.log("surroundingQuotes", surroundingQuotes)
  // console.log('hasSurroundingQuotes', hasSurroundingQuotes)

  // console.log('value', value)
  // let value = value
    // .replace(/^{{2,}/, '{')
    // .replace(/}{2,}$/, '}')
    // .replace(/^\[{2,}/, '[')
    // .replace(/\]{2,}$/, ']')

  // If Doesn't look like JSON object
  if (value.match(/^{[^:,]*}/)) {
    value = removeSurroundingBrackets(value)
  // If looks like array in brackets
  } else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ]   }
    value = removeSurroundingBrackets(value)
  }
  // console.log('value', value)
  return {
    key: key,
    value: hasSurroundingQuotes ? value.replace(SURROUNDING_QUOTES, '') : convert(value),
  }
}

function trimTrailingComma(str = '') {
  // Trim trailing commas
  return str.replace(/,$/, '')
}

function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

module.exports = optionsParse