const { parseJSON } = require('json-alexander')

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
    console.log('val', value)
    console.log('err', err)
  }
  return value
}

const RESERVED = '__private'

function doWeirdParse(x) {
  // https://regex101.com/r/bx8DXm/1/ Match everything but spaces/newlines
  var y = /("|'|{)[^"}]+("|'|})|(\S+)/g

  const cleanLines = x
    .split(/\n/)
    .filter((line) => {
      // Trim all comment blocks
      return !line.trim().match(/^(\/\/+|\/\*+|#+)/gm)
    })
    .join('\n')

  var lines = cleanLines.match(y)
  // console.log('lines', lines.length)
  // console.log('lines', lines)
  var isEnding = /(['"}\]]|true,?|false,?)$/

  const values = lines.reduce((acc, curr, i) => {
    const isLastLoop = lines.length === (i + 1)
    const nextItem = lines[i + 1] || '' 
    const hasText = curr.match(/^[A-Za-z]/)
    let alreadyAdded = false

    /*
    console.log('isLastLoop', isLastLoop)
    console.log('RESERVED', acc[RESERVED]) 
    console.log("current item", curr) 
    console.log('next item   ', nextItem) 
    /** */

    // If has no = its a true boolean. e.g isThingy
    if (hasText && acc[RESERVED].match(/^[A-Za-z]/) && !isValuePair(acc[RESERVED])) {
      // console.log('xxxxxxx', acc[RESERVED])
      acc[trimTrailingComma(acc[RESERVED])] = true
      acc[RESERVED] = ''
    } 
    // If has no = its a true boolean
    if (hasText && !curr.match(isEnding) && acc[RESERVED].match(isEnding)) {
      // console.log('end', curr)
      const kv = getKeyAndValueFromString(acc[RESERVED])
      if (kv) {
        acc[kv.key] = kv.value
      }
      acc[RESERVED] = ''
    }

    if (!acc[RESERVED].match(/^[A-Za-z]+={+/) && isValuePair(curr) && curr.match(isEnding)) {
      const kv = getKeyAndValueFromString(curr)
      if (kv) {
        // console.log(`ADDED`, kv)
        acc[kv.key] = kv.value
      }
    } else {
      // console.log('Add', curr)
      alreadyAdded = true
      acc[RESERVED] = acc[RESERVED] + curr
    }


    if (acc[RESERVED].match(isEnding) && nextItem.match(/^[A-Za-z0-9_-]/)) {
      const kv = getKeyAndValueFromString(acc[RESERVED])
      if (kv) {
        // console.log(`acc[RESERVED].match(isEnding)`, kv)
        acc[kv.key] = kv.value
      }
      acc[RESERVED] = ''
    }

    // If ends in number foo=2 or bar=3,
    if (isValuePair(curr) && curr.match(/\d,?$/)) {
      const kv = getKeyAndValueFromString(acc[RESERVED])
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
        const kv = getKeyAndValueFromString(valueToCheck)
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
  return str.match(/=/)
}

// https://melvingeorge.me/blog/check-if-string-contain-emojis-javascript OR https://www.npmjs.com/package/emoji-regex
function hasEmoji(str) {
  const regexExp = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
  return regexExp.test(str)
}

function getKeyAndValueFromString(string) {
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