const path = require('path')
const isGlob = require('is-glob')
const isValidFilePath = require('is-valid-path')
const { parse } = require('oparser')
const { getFirstCharacter } = require('./utils/text')
const { REGEX_REGEX, escapeRegexString } = require('./utils/regex')

const ARRAY_REGEX = /^\[(.*)\]$/
const NOT_OBJECT_LIKE = /^{[^:,]*}/
const IS_KEY_VALUE_NON_ARRAY = /^([A-Za-z0-9_.-]*)=\s?([^\[\{]]*)([^\[\{]*)$/
const IS_KEY_VALUE_IN_QUOTES = /^([A-Za-z0-9_.-]*)=\s?("|')(.*)(\2)$/
const IS_KEY_VALUE_START_WITH_QUOTE = /^([A-Za-z0-9_.-]*)=\s?("|')(.*)/
const IS_INTEGER = /^([A-Za-z0-9_.-]*)=\s?-?\d*(\.(?=\d))?\d*$/
const IS_BOOLEAN_OR_NULL = /^([A-Za-z0-9_.-]*)=\s?true|false|null|undefined\s?/

function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(ARRAY_REGEX.test(str))
}

function stringLooksLikeFile(value) {
  return !value.match(/^-+/) // isn't option looking
    && isValidFilePath(value)
    && (
      path.basename(value).indexOf('.') > -1 // has period
      || getFirstCharacter(value) === '_' // starts with _
    )
}

function getValue(val) {
  return (val[1] !== '=') ? val[1] : val[0]
}

function trimLeadingDashes(value) {
  return value.replace(/^-+/, '')
}

function removeNodeModules(value = '') {
  if (typeof value !== 'string') {
    return true
  }
  return !value.match(/node_modules\//)
}

function coerceStringToRegex(str) {
  const isRegex = str.match(REGEX_REGEX)
  if (!isRegex) {
    return str
  }
  const [ _match, pattern, flags ] = isRegex
  return new RegExp(escapeRegexString(pattern), flags)
}

function convertToArray(str = '') {
  const { fixedArray } = parse(`fixedArray=${str}`)
  return (fixedArray || [])
}

function addValue(value, currentCollection) {
  if (isArrayLike(value)) {
    const array = convertToArray(value)
    return Array.from(new Set(currentCollection.concat(array)))
  }
  if (currentCollection.indexOf(value) > -1) {
    return currentCollection
  }
  return currentCollection.concat(value)
}

function customIsGlob(arg) {
  // If looks like json object, return false
  if (arg.match(/^{[^}]*:[^}]*}/)) {
    return false
  }
  return isGlob(arg)
}

function getGlobGroupsFromArgs(args, opts = {}) {
  const globKeys = opts.globKeys || []
  let preceding = ['', '']
  let collection = []
  let globGroups = []
  let reserved = []
  let otherOpts = []
  let cacheKey = ''

  for (let i = 0; i < args.length; i++) {
    const isLastArg = (args.length - 1) === i
    const arg = args[i]
    const prevArg = args[i - 1]
    const looksLikeFile = stringLooksLikeFile(arg)

    if (looksLikeFile && typeof cacheKey !== 'undefined') {      
      collection.push(arg)
    } else if (arg.match(/^-+/) && !arg.match(/=/)) {
      cacheKey = arg
      if (collection.length) {
        const val = getValue(preceding)
        reserved.push(val)
        globGroups.push({
          key: trimLeadingDashes(val),
          rawKey: val,
          values: collection.filter(removeNodeModules).map((x) => coerceStringToRegex(x))
        })
        collection = []
      }
      preceding = [ prevArg, arg ]
    } else if (cacheKey && arg.match(/=/)) {
      cacheKey = undefined
    }

    const cleanKey = trimLeadingDashes(cacheKey || '')
    const isDefinedGlobKey = globKeys.includes(cleanKey) || globKeys.includes(cacheKey)

    if (isDefinedGlobKey && (isGlob(arg) || looksLikeFile)) {
      collection = addValue(arg, collection)
    } else {
      const notObjectLike = arg.match(NOT_OBJECT_LIKE) && !isArrayLike(arg)
      if (
        (notObjectLike) ||
        !cacheKey && customIsGlob(arg) && !arg.match(/=/)
      ) {
        collection = addValue(arg, collection)
      } else if (!looksLikeFile) {
        if (
            arg.match(IS_KEY_VALUE_IN_QUOTES) 
            || arg.match(IS_KEY_VALUE_START_WITH_QUOTE) 
            || arg.match(IS_INTEGER)
            || arg.match(IS_BOOLEAN_OR_NULL)
          ) {
          otherOpts.push(arg)
        } else if (arg.match(IS_KEY_VALUE_NON_ARRAY)) {
          otherOpts.push(arg.replace(IS_KEY_VALUE_NON_ARRAY, '$1="$2$3"'))
        } else {
          otherOpts.push(arg)
        }
      }
    }
    
    if (isLastArg && collection.length) {
      const val = getValue(preceding)
      reserved.push(val)
      globGroups.push({
        key: trimLeadingDashes(val),
        rawKey: val,
        values: collection.filter(removeNodeModules).map((x) => coerceStringToRegex(x)),
      })
      collection = []
    }
  }

  return {
    globGroups,
    otherOpts: otherOpts.filter((opt) => !reserved.includes(opt))
  }
}

module.exports = {
  getGlobGroupsFromArgs,
  // Export helpers for testing
  isArrayLike,
  stringLooksLikeFile,
  getValue,
  trimLeadingDashes,
  removeNodeModules,
  coerceStringToRegex,
  convertToArray,
  addValue,
  customIsGlob
} 