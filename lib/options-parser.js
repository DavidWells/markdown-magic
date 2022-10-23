const { parseJSON } = require('json-alexander')

// alt approach maybe https://github.com/etienne-dldc/literal-parser
const RESERVED = '__private'
const SPACES = '__SPACE__'
const NEWLINE = '__NEWLINE__'
const BREAK = '__OPT_BREAK__'
const SURROUNDING_QUOTES = /^("|'|`)|("|'|`)$/g
const STARTS_WITH_VALID_CHAR = /^[A-Za-z0-9_]/
const ARRAY_REGEX = /^\[(.*)\]$/
const OBJECT_REGEX = /^\{(.*)\}$/
const TRAILING_COMMAS = /,+$/
const TRAILING_ARRAY_COMMAS = /(?:,*[^\S]*)+?]$/
// https://regex101.com/r/cy7mLe/1
const TRAILING_OBJECT_COMMAS = /(?:,*[^\S]*)*?}$/

function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(ARRAY_REGEX.test(str))
}

function isObjectLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(OBJECT_REGEX.test(str))
}

function convert(value) {
  // console.log(typeof value)
  // console.log('convert preparse value', value)
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

  try {
    /* Trim trailing commas in arrays */
    if (isArrayLike(value)) {
      value = value.replace(TRAILING_ARRAY_COMMAS, ']')
    } else if (isObjectLike(value)) {
      /* Trim trailing commas in object */
      value = value.replace(TRAILING_OBJECT_COMMAS, '}')
    }
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
    // console.log('post parse', value)
    return val
  } catch (err) {
    // console.log('parse error', err)
    // console.log('json val', value)
    /* Convert array looking string into values */
    if (typeof value === 'string' && ARRAY_REGEX.test(value)) {
      const inner = value.match(ARRAY_REGEX)
      if (inner && inner[1]) {
        const composeValue = inner[1]
          .replace(TRAILING_COMMAS, '') // remove dangling commas JSON alt MATCH_DANGLING_COMMAS /}(,[^}]*?)]}?$/
          .split(',')
          .reduce((acc, curr) => {
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
  // console.log('val', val)
  if (typeof val === 'string') {
    return val
      .replace(/__SPACE__/g, ' ')
      .replace(/__NEWLINE__/g, '\n')
  }
  return val
}

/**
 * Parse string of key value options
 * @param {string} input - string of options. Can be multiline
 * @returns {Record<string, any>}
 */
function optionsParse(input) {
  if (typeof input === 'undefined' || input === null || input === '') {
    return {}
  }
  // https://regex101.com/r/bx8DXm/1/ Match everything but spaces/newlines
  // var pattern = /("|'|{)[^"}]+("|'|})|(\S+)/g
  var pattern = /(\S+)/g

  //var y = /("|{)[^"}]+("|})|([^\r\n\t\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+)/gm
  
  const cleanLines = input
    //.replace(/\n/g, NEWLINE)
    // Remove JS comment blocks and single line comments https://regex101.com/r/XKHU18/2 | alt https://regex101.com/r/ywd8TT/1
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/gm, '')
    /* Temporarily replace newlines with placeholder */
    .replace(/\n(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, NEWLINE)
    .replace(/\n(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, NEWLINE)
    .replace(/\n(?=(?:(?:[^`]*(?:`)){2})*[^`]*(?:`)[^`]*$)/g, NEWLINE)
    /* Temporarily replace spaces with placeholder */
    // bob="co ol" steve="c ool" --> add temp spaces
    .replace(/\s(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, SPACES)
    // bob='co ol' steve='c ool' --> add temp spaces
    .replace(/\s(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, SPACES)
    // bob=`co ol` steve=`c ool` --> add temp spaces
    .replace(/\s(?=(?:(?:[^`]*(?:`)){2})*[^`]*(?:`)[^`]*$)/g, SPACES)
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
  //console.log('cleanLines', cleanLines)

  var lines = cleanLines
    .replace(/__SPACE__([a-zA-Z]*)=/g, `${BREAK}$1=`)
    // Fix out of option new line replacements https://regex101.com/r/ttlXyt/1
    .replace(/__NEWLINE__(?:__SPACE__)*__OPT_BREAK__/g, BREAK)
    .match(pattern)
    .map(fixSpaceStrings)
    /* if BREAK split string again */
    .map((item) => {
      return item.split(BREAK)
    }).flat()

  // console.log('lines', lines)
  var isEnding = /(['"}\]]|true,?|false,?)$/
  // var isEnding = /(['"}\]]|true,?|false,?|[A-Za-z0-9"']+,?)$/ // false positive on arrays
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

    /* If has no = its a true boolean. e.g isThingy */
    if (hasText && acc[RESERVED].match(STARTS_WITH_VALID_CHAR) && !isValuePair(acc[RESERVED])) {
      // console.log('xxxxxxx', acc[RESERVED])
      acc[acc[RESERVED]] = true
      acc[RESERVED] = ''
      // return fails, need to refine which runs first
      // return acc
    }

    /* If has no = its a true boolean
    if (
        hasText
        && !curr.match(isEnding) 
        && acc[RESERVED].match(isEnding) 
        && !acc[RESERVED].match(isJsonLike)
      ) {
      console.log('end', curr)
      // console.log('acc[RESERVED]', acc[RESERVED])
      const kv = getKeyAndValueFromString(acc[RESERVED], 'boolean')
      if (kv) {
        acc[kv.key] = kv.value
        acc[RESERVED] = ''
        return acc
      }
    }
    */

    if (!acc[RESERVED].match(/^[A-Za-z]+={+/) && isValuePair(curr) && curr.match(isEnding)) {
      const kv = getKeyAndValueFromString(curr, 'one')
      // console.log('kv', kv)
      if (kv) {
        // console.log(`ADDED`, kv)
        acc[kv.key] = kv.value
        return acc
      }
    }
    
    if (curr.match(isKeyValNoQuotes)) {
      // console.log('curr', curr)
      const kv = getKeyAndValueFromString(curr, 'curr.match(isKeyValNoQuotes)')
      // console.log('no quotes')
      if (kv) {
        acc[kv.key] = kv.value
        return acc
      }
    }

    const updated = acc[RESERVED] + curr
    // console.log('SET reserve', `"${updated}"`)
    if (!updated.match(isEnding) && updated.match(isKeyValNoQuotes)) {
      // console.log('UPDATED HERE', updated)
      const kv = getKeyAndValueFromString(updated, 'fall')
      if (kv) {
        acc[kv.key] = kv.value
        acc[RESERVED] = ''
        return acc
      }
    } else {
      // Handle trailing option commas funny='what', funky="cool", weird=what, case
      if (!updated.match(isJsonLike) && updated.match(TRAILING_COMMAS)) {
        const kv = getKeyAndValueFromString(updated.replace(TRAILING_COMMAS, ''), 'commas')
        acc[kv.key] = kv.value
        acc[RESERVED] = ''
        return acc
      }
      // console.log('ALREADy', updated)
      alreadyAdded = true
      acc[RESERVED] = updated
      //return acc
    }
    
    if (
      acc[RESERVED].match(isEnding)
      && nextItem.match(/^[A-Za-z0-9_-]/)
      && isBalanced(acc[RESERVED]) // If value is balanced brackets {[()]}
    ) {
      const kv = getKeyAndValueFromString(acc[RESERVED], 'xxxx')
      if (kv) {
        acc[kv.key] = kv.value
        acc[RESERVED] = ''
        return acc
      }
    }

    // If ends in number foo=2 or bar=3, but ignore foo=[2 and foo=[{2
    if (isValuePair(curr) && curr.match(/\d,?$/) && !curr.match(/=\{?\[/)) {
      const kv = getKeyAndValueFromString(acc[RESERVED], 'numberMatch')
      if (kv) {
        acc[kv.key] = kv.value
        acc[RESERVED] = ''
        return acc
      }
    }

    if (!isLastLoop) {
      return acc
    }

    // If last loop and still no match and looks like KV. Parse it
    if (isLastLoop) {
      // console.log("acc[RESERVED]", acc[RESERVED])
      // console.log('acc[RESERVED] + curr', acc[RESERVED] + curr)
      /* If value empty but __private have accumulated values */
      if (acc[RESERVED]) {
      // if (acc[RESERVED] && (acc[RESERVED].match(isEnding) || isValuePair(acc[RESERVED]))) {
        const valueToCheck = (curr.match(isEnding) && !alreadyAdded) ? acc[RESERVED] + curr : acc[RESERVED]
        // console.log('valueToCheck', valueToCheck)
        const kv = getKeyAndValueFromString(valueToCheck, 'lastLoop')
        if (kv) {
          acc[kv.key] = kv.value
          acc[RESERVED] = ''
        }
      }
    }

    return acc
  }, {
    [RESERVED]: '',
  })

  // console.log('values', values)
  delete values[RESERVED]

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

function getKeyAndValueFromString(string, callLocation) {
  /*
  console.log(`getKeyAndValueFromString from ${callLocation}`)
  console.log(`|${string}|`)
  /** */
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

  // console.log('values', values)
  /* If no value, isThing === true */
  const hasEqual = string.indexOf('=') > -1
  if (!hasEqual) {
    return {
      key,
      value: true,
    }
  }

  let value = string.substring(string.indexOf('=') + 1)
    // Trim trailing commas
    .replace(TRAILING_COMMAS, '')

  /*
  console.log('key', key)
  console.log('value', value)
  /** */

 
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

  // console.log('xvalue', value)
  // let value = value
    // .replace(/^{{2,}/, '{')
    // .replace(/}{2,}$/, '}')
    // .replace(/^\[{2,}/, '[')
    // .replace(/\]{2,}$/, ']')

  // If Doesn't look like JSON object
  if (value.match(/^{[^:,]*}/)) {
    value = removeSurroundingBrackets(value)
  // If looks like array in brackets {[ thing, thing, thing ]}
  } else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ]   }
    value = removeSurroundingBrackets(value)
  // If matches {` stuff `} & {[ stuff ]}
  } else if (value.match(/^{(?:`|\[)([\s\S]*?)(?:`|\])}$/)) {
    value = removeSurroundingBrackets(value)
  }
  // console.log('value', value)

  /* Check if remaining value is surrounded by quotes */
  const surroundingQuotes = value.match(SURROUNDING_QUOTES) || []
  const hasSurroundingQuotes = surroundingQuotes.length === 2 && (surroundingQuotes[0] === surroundingQuotes[1])
  /*
  console.log('surroundingQuotes', surroundingQuotes)
  console.log('hasSurroundingQuotes', hasSurroundingQuotes)
  /** */

  // console.log('yvalue', value)
  return {
    key,
    value: hasSurroundingQuotes ? value.replace(SURROUNDING_QUOTES, '') : convert(value),
  }
}

function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

/**
 * Parse string of key value options. Template tag version
 * @param {string} input - string of options. Can be multiline
 * @returns {Record<string, any>}
 */
function options(input = '', ...substitutions) {
  let str = String.raw(input, ...substitutions)
  return optionsParse(str)
}

module.exports = {
  isArrayLike,
  isObjectLike,
  optionsParse,
  options
}