const { parseJSON } = require('json-alexander')

// alt approach maybe https://github.com/etienne-dldc/literal-parser

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
  // console.log('value', value)
  try {
    const val = parseJSON(value) // last attempt to format an array like [ one, two ]
    if (typeof val === 'string' && val.match(/^\[/) && val.match(/\]$/)) {
      const inner = val.match(/^\[(.*)\]/)
      if (inner && inner[1]) {
        const newVal = inner[1].split(', ').map((x) => {
          return convert(x.trim())
        })
        return newVal
      }
    }
    return val
  } catch (err) {
    // console.log('json val', value)
    // console.log('err', err)
    /* Fix fallthrough strings remove surrounding strings */
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.replace(/^"|"$/g, '')
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.replace(/^'|'$/g, '')
    }
  }
  return value
}

const RESERVED = '__private'
const SPACES = '__SPACE__'
const BREAK = '__OPT_BREAK__'
function fixSpaceStrings(val) {
  if (typeof val === 'string') {
    return val.replace(/__SPACE__/g, ' ')
  }
  return val
}

function doWeirdParse(x) {
  if (typeof x === 'undefined' || x === '') {
    return {}
  }
  // https://regex101.com/r/bx8DXm/1/ Match everything but spaces/newlines
  // var pattern = /("|'|{)[^"}]+("|'|})|(\S+)/g
  var pattern = /(\S+)/g

  //var y = /("|{)[^"}]+("|})|([^\r\n\t\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+)/gm

  const cleanLines = x
    // Remove JS comment blocks and single line comments https://regex101.com/r/XKHU18/2
    .replace(/\s+\/\*[\s\S]*?\*\/|\s+\/\/.*$/g, '')
    // bob="co ol" steve="c ool" --> add temp spaces
    .replace(/\s+(?=(?:(?:[^"]*(?:")){2})*[^"]*(?:")[^"]*$)/g, SPACES)
    // bob='co ol' steve='c ool' --> add temp spaces
    .replace(/\s+(?=(?:(?:[^']*(?:')){2})*[^']*(?:')[^']*$)/g, SPACES)
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
    .join('\n')
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
  var isKeyValNoQuotes = /^[A-Za-z]+=[A-Za-z]/
  // @TODO Get real json matcher 
  var isJsonLike = /[{[]/

  const values = lines.reduce((acc, curr, i) => {
    let alreadyAdded = false
    const isLastLoop = lines.length === (i + 1)
    const nextItem = lines[i + 1] || '' 
    const hasText = curr.match(/^[A-Za-z]/)
    /*
    console.log('___________________')
    console.log('isLastLoop', isLastLoop)
    console.log('RESERVED', acc[RESERVED]) 
    console.log("current item", `|${curr}|`) 
    console.log('next item   ', `|${nextItem}|`) 
    console.log('===================')
    /** */

    // If has no = its a true boolean. e.g isThingy
    if (hasText && acc[RESERVED].match(/^[A-Za-z]/) && !isValuePair(acc[RESERVED])) {
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
  // console.log(`getKeyAndValueFromString from ${from}`)
  // console.log(`|${string}|`)
  if (!string) return
  // const keyValueRegex = /([A-Za-z-_$]+)=['{"]?(.*)['}"]?/g
  // const match = keyValueRegex.exec(string)
  // if (!match) {
  //   return
  // }
  // console.log('getKeyAndValueFromString')

  const [key, ...values] = string.split('=')
  /* If no key or key starts with --- */
  if (!key || key.charAt(0) === '-' || hasEmoji(key)) {
    return
  }
  // console.log('string', string)
  // console.log('key', key)
  // console.log('values', values)
  /* If no value, isThing === true */
  if (!values.length) {
    return {
      key: key,
      value: true,
    }
  }

  const value = values.join('')

  let cleanValue = value
    .replace(/^{{2,}/, '{')
    .replace(/}{2,}$/, '}')
    .replace(/^\[{2,}/, '[')
    .replace(/\]{2,}$/, ']')
    // Trim trailing commas
    .replace(/,$/, '')

  if (value.match(/^{[^:,]*}/)) {
    cleanValue = removeSurroundingBrackets(cleanValue)
  } else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ]   }
    cleanValue = removeSurroundingBrackets(cleanValue)
  }

  return {
    key: key,
    value: convert(cleanValue),
  }
}

function trimTrailingComma(str = '') {
  // Trim trailing commas
  return str.replace(/,$/, '')
}

function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

module.exports = doWeirdParse