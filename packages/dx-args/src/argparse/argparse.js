const mri = require('mri')
const { parse } = require('oparser')
const { getGlobGroupsFromArgs } = require('../globparse')
const { splitOutsideQuotes } = require('./splitOutsideQuotes')
const { IS_NEGATIVE_NUMBER } = require('../utils/regex')
/*
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
// process.exit(1)
/** */

const IS_KEY_VALUE_IN_QUOTES = /^([A-Za-z0-9_.]*)=\s?("|')(.*)(\2)$/
const IS_KEY_VALUE_START_WITH_QUOTE = /^([A-Za-z0-9_.]*)=\s?("|')?(.*)/
const SHELL_QUOTED_KEY_VALUE = /^\s*-*([A-Za-z0-9_.-]+)=([\s\S]*)$/
const SIMPLE_KEY = /^[^\s=]+$/
const IS_EMPTY_KEY_VALUE = /^-*([A-Za-z0-9_.-]+)=$/
const STARTS_WITH_KEY_VALUE = /^-*[A-Za-z0-9_.-]+=/

/**
 * @typedef {Object} GlobGroup
 * @property {string} key
 * @property {string} rawKey
 * @property {Array<string|RegExp>} values
 */

/**
 * @typedef {Object} ParseOptions
 * @property {boolean} [allowShortClusters]
 * @property {string[]} [shortFlags]
 * @property {boolean} [stripSingleDashOptions]
 * @property {string[]|Record<string, boolean>} [accumulate]
 * @property {string[]|Record<string, boolean>} [accumulateFlags]
 * @property {string[]|Record<string, boolean>} [arrayKeys]
 * @property {boolean} [noPrefix]
 * @property {string[]|Record<string, boolean>} [string]
 * @property {string[]} [globKeys]
 * @property {boolean} [debug]
 */

/**
 * @typedef {Object} ParseResult
 * @property {string} rawArgv
 * @property {string[]} leadingCommands
 * @property {GlobGroup[]} globGroups
 * @property {Record<string, unknown>} extraParse
 * @property {Record<string, unknown>} mriOptionsOriginal
 * @property {Record<string, unknown>} mriOptionsClean
 * @property {boolean} mriDiff
 * @property {string} yargsParsed
 * @property {Record<string, unknown>} mergedOptions
 */

/*
node cli.js hahaha -y -rx yoyo nono=haha --stage prod -nice=true word = bond -ab

[
  _ ['hahaha'],
  'y': true,
  'r': true,
  'x': true,
  'yoyo': true,
  'nono: haha',
  'stage': 'prod',
  'nice': true,
  'word': 'bond',
  'a': true,
  'b': true,
]
*/

function isNegativeNumber(input) {
  return IS_NEGATIVE_NUMBER.test(input)
}

/**
 * A token that contains whitespace can only reach argv if the shell quoted it,
 * so it is one value and must never be re-split.
 * @param {unknown} token
 */
function isShellQuoted(token) {
  return typeof token === 'string' && /\s/.test(token) && token.trim() !== '='
}

/* An empty token only reaches argv from explicit quotes (`--name ""`), so it is a real value */
function isWholeValue(token) {
  return token === '' || token === '-' || isShellQuoted(token)
}

/**
 * mri reads `-5` as a flag named `5` and ignores `-` as a value. Attach either one to the
 * option before it (`--count -5` becomes `--count=-5`) and drop it anywhere else.
 * @param {string[]} argv
 */
function getMriArgv(argv, stringKeys = new Set()) {
  const out = []
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    const prevToken = out[out.length - 1]
    if (
      i > 0
      && prevToken === argv[i - 1]
      && isOptionLike(prevToken)
      && !prevToken.includes('=')
      && stringKeys.has(prevToken.replace(/^-+/, ''))
    ) {
      out[out.length - 1] = `${prevToken}=${token}`
      continue
    }
    if (token === '') continue
    if (isNegativeNumber(token) || token === '-') {
      const prev = out[out.length - 1]
      if (prev === argv[i - 1] && isOptionLike(prev) && prev !== '--' && prev !== '-' && !prev.includes('=')) {
        out[out.length - 1] = `${prev}=${token}`
      }
      continue
    }
    out.push(token)
  }
  return out
}

function isOptionLike(token = '') {
  return /^-+/.test(token) && !isNegativeNumber(token)
}

function countChar(str, char) {
  return str.split(char).length - 1
}

/* True when quotes or brackets do not pair up, e.g. `[abc` or `it's` */
function isUnbalanced(str = '') {
  return countChar(str, '[') !== countChar(str, ']')
    || countChar(str, '{') !== countChar(str, '}')
    || countChar(str, '"') % 2 === 1
    || countChar(str, "'") % 2 === 1
}

/**
 * Resolve a whole (shell-quoted) value without re-splitting it.
 * @param {string} raw
 * @param {boolean} [alwaysStripQuotes] - strip wrapping quotes even when the same quote is used inside
 */
function parseWholeValue(raw, alwaysStripQuotes) {
  const trimmed = raw.trim()
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  if (trimmed.length > 1 && (first === '"' || first === "'") && first === last) {
    const inner = trimmed.slice(1, -1)
    if (alwaysStripQuotes || !inner.includes(first)) {
      return inner
    }
  }
  if ((first === '{' && last === '}') || (first === '[' && last === ']')) {
    try {
      const parsed = parse(`v=${trimmed}`)
      if (parsed && typeof parsed.v === 'object' && parsed.v !== null) {
        return parsed.v
      }
    } catch (e) {
      // not object/array syntax, keep the string
    }
  }
  return raw
}

/**
 * @param {ParseOptions|boolean} [opts]
 * @returns {ParseOptions}
 */
function normalizeParseOptions(opts) {
  if (opts === true) {
    return {
      allowShortClusters: true,
      shortFlags: [],
      stripSingleDashOptions: true,
    }
  }
  return {
    allowShortClusters: false,
    shortFlags: [],
    stripSingleDashOptions: true,
    globKeys: ['files', 'file', 'path'],
    ...opts,
  }
}

function isShortCluster(word = '', opts = {}) {
  if (!opts.allowShortClusters || word.length < 2 || word.includes('=')) {
    return false
  }
  if (!opts.shortFlags || !opts.shortFlags.length) {
    return true
  }
  return word.split('').every((letter) => opts.shortFlags.includes(letter))
}

/**
 * @param {ParseOptions} [opts]
 */
function getAccumulatorKeys(opts = {}) {
  return toKeySet(opts.accumulate || opts.accumulateFlags || opts.arrayKeys)
}

/**
 * @param {string[]|Record<string, boolean>} [keys]
 * @returns {Set<string>}
 */
function toKeySet(keys = []) {
  if (Array.isArray(keys)) {
    return new Set(keys)
  }
  return new Set(Object.keys(keys).filter((key) => keys[key]))
}

/**
 * Keys that always take the next token as a string value. Glob keys keep their file grouping.
 * @param {ParseOptions} [opts]
 */
function getStringKeys(opts = {}) {
  const keys = toKeySet(opts.string)
  ;(opts.globKeys || []).forEach((key) => keys.delete(key))
  return keys
}

function stripWrappingQuotes(value) {
  const first = value[0]
  if (value.length > 1 && (first === '"' || first === "'") && first === value[value.length - 1]) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * @param {string} key
 * @param {unknown} value
 * @param {ParseOptions} [opts]
 */
function normalizeNoPrefix(key, value, opts = {}) {
  if (opts.noPrefix === false || !key.startsWith('no-') || typeof value !== 'boolean') {
    return { key, value }
  }
  return {
    key: key.slice(3),
    value: !value,
  }
}

/**
 * @param {Array<Record<string, unknown>>} [pieces]
 * @param {ParseOptions} [opts]
 * @returns {Record<string, unknown>}
 */
function mergeOptionPieces(pieces = [], opts = {}) {
  const accumulatorKeys = getAccumulatorKeys(opts)
  return pieces.reduce((acc, piece) => {
    const rawKey = Object.keys(piece)[0]
    /* oparser returns nothing usable for some tokens (e.g. `__proto__=x`) */
    if (typeof rawKey === 'undefined') {
      return acc
    }
    const normalized = normalizeNoPrefix(rawKey, piece[rawKey], opts)
    if (accumulatorKeys.has(normalized.key)) {
      acc[normalized.key] = (acc[normalized.key] || []).concat(normalized.value)
    } else {
      acc[normalized.key] = normalized.value
    }
    return acc
  }, {})
}

function getLeadingCommands(args = []) {
  const leadingCommands = []
  for (let i = 0; i < args.length; i++) {
    const curr = args[i]
    const next = args[i + 1] || ''
    if (curr === '') continue
    if (
      typeof curr !== 'string'
      || curr.match(/^-|^=$/)
      || curr.match(IS_KEY_VALUE_START_WITH_QUOTE)
      || next.trim() === '='
    ) {
      break
    }
    leadingCommands.push(curr)
  }
  return leadingCommands
}

/**
 * Parse a CLI argv array into forgiving merged options, glob groups, and diagnostics.
 * @param {string[]} [_rawArgv=[]]
 * @param {ParseOptions|boolean} [opts={}]
 * @returns {ParseResult}
 */
function dxParse(_rawArgv = [], opts = {}) {
  const parseOptions = normalizeParseOptions(opts)
  const { stripSingleDashOptions = true } = parseOptions
  const isDebug = Boolean(parseOptions.debug)
  const debug = isDebug ? console.log : () => {}
  const rawArgv = _rawArgv
  /* mri turns an empty value into 0, so it never sees empty tokens. extraParse carries them. */
  const stringKeys = getStringKeys(parseOptions)
  let mriOptionsOriginal = mri(getMriArgv(rawArgv, stringKeys), { string: Array.from(stringKeys) })

  const yargsParsed = 'not enabled' //yargs(_rawArgv).parse()
  let extraParse = {}
  let globGroups = []
  let leadingCommands = []
  const mriOptionsClean = Object.assign({}, mriOptionsOriginal)
  /* mriOptionsClean only ever loses keys, so it differs exactly when one was deleted */
  let mriDiff = false

  if (isDebug) {
    debug('_singleDashOptions', findSingleDashStrings(rawArgv))
  }

  if (!rawArgv || !rawArgv.length) {
    return {
      leadingCommands,
      extraParse,
      mriOptionsOriginal,
      globGroups
    }
  }
  //*
  debug('rawArgv', rawArgv)
  debug('mri mriOptionsOriginal', mriOptionsOriginal)
  /** */
  /* If raw args found, process them further */
  if (
    rawArgv.length
    // && (mriOptionsOriginal._ && mriOptionsOriginal._.length || (mriOptionsOriginal.file || mriOptionsOriginal.files))
  ) {
    // if (isGlob(rawArgv[0])) {
    //   console.log('glob', rawArgv[0])
    //   mriOptionsOriginal.glob = rawArgv[0]
    // }
    const globParse = getGlobGroupsFromArgs(rawArgv, {
      /* CLI args that should be glob keys */
      globKeys: parseOptions.globKeys,
      stringKeys: Array.from(stringKeys)
    })
    globGroups = globParse.globGroups
    const { otherOpts } = globParse
    leadingCommands = getLeadingCommands(otherOpts)
    debug('globGroups', globGroups)
    /*

    console.log('globParse', globParse)
    // deepLog(globParse)
    process.exit(1)
    /** */
    /* Parse for weird CLI inputs */

    /* Handle -- and - flags */

    debug('left over otherOpts after globParse', otherOpts)
    let newArray = []
    let dashDashSet = false
    let rest = []
    for (let i = 0; i < otherOpts.length; i++) {
      const rawCurr = otherOpts[i]
      const curr = rawCurr.trim()
      const currIsNegativeNumber = isNegativeNumber(curr)
      const prev = newArray[i - 1]
      const next = otherOpts[i + 1] || ''
      const nextNext = otherOpts[i + 2] || ''
      const isLast = otherOpts.length === i + 1
      if (isDebug) {
        const opt = cleanOption(curr)
        debug('--------------------------------')
        debug(`current  "${curr}"`)
        debug(`cleaned  "${opt}"`)
        debug(`previous "${opt}"`, prev)
        debug(`next for "${opt}"`, next)
        debug(`nextNext "${opt}"`, nextNext)
        debug('--------------------------------')
      }

      if (dashDashSet) {
        rest.push(curr)
        continue
      }

      if (curr === '--') {
        dashDashSet = true
        continue
      }

      /* Declared string keys take their value verbatim: `--env NODE_ENV=production`, `--grep -v` */
      if (stringKeys.size) {
        const hasNext = i + 1 < otherOpts.length
        const spacedEquals = hasNext && next.trim() === '=' && i + 2 < otherOpts.length
        const optionKey = curr.match(/^-+([^\s=]+)$/)
        const keyValue = rawCurr.match(SHELL_QUOTED_KEY_VALUE)
        let stringKey
        let stringValue
        if ((optionKey && stringKeys.has(optionKey[1])) || (stringKeys.has(curr) && spacedEquals)) {
          stringKey = optionKey ? optionKey[1] : curr
          stringValue = ''
          if (spacedEquals) {
            stringValue = otherOpts[i + 2]
            i += 2
          } else if (hasNext) {
            stringValue = otherOpts[i + 1]
            i += 1
          }
        } else if (keyValue && stringKeys.has(keyValue[1])) {
          stringKey = keyValue[1]
          stringValue = keyValue[2]
        }
        if (stringKey) {
          newArray.push({ piece: { [stringKey]: stripWrappingQuotes(stringValue) } })
          continue
        }
      }

      let currentIsSingleDashOption = false
      if (curr.match(/^-[^-]/) && !currIsNegativeNumber) {
        debug('single dash option', curr)
        currentIsSingleDashOption = true
      }
      if (currIsNegativeNumber) {
        const last = newArray[newArray.length - 1]
        const isValueOfKey = typeof last === 'string' && /=\s?$/.test(last)
        /* `--count -5` is a value. A bare `-5` is a positional, like any other word. */
        newArray.push(isValueOfKey ? curr + ' ' : { piece: { [curr]: true } })
        continue
      }
      /* A lone dash (stdin by convention) that is not the value of a key */
      if (curr === '-') {
        newArray.push({ piece: { '-': true } })
        continue
      }
      /* Shell-quoted tokens stay whole instead of going through the string round-trip */
      if (curr === '') {
        /* Empty or blank token that is not the value of a key */
        continue
      }
      /* `name= stage=prod`: two separate tokens, so name is empty and stage is its own pair.
         `name= value` still joins further down. */
      const emptyKeyValue = curr.match(IS_EMPTY_KEY_VALUE)
      if (emptyKeyValue && STARTS_WITH_KEY_VALUE.test(next)) {
        newArray.push({ piece: { [emptyKeyValue[1]]: '' } })
        continue
      }
      if (isShellQuoted(rawCurr)) {
        const keyValue = rawCurr.match(SHELL_QUOTED_KEY_VALUE)
        if (keyValue) {
          newArray.push({ piece: { [keyValue[1]]: parseWholeValue(keyValue[2], true) } })
          continue
        }
        if (!curr.match(/^-/)) {
          newArray.push({ piece: { [curr]: true } })
          continue
        }
      }
      if (SIMPLE_KEY.test(curr) && !curr.match(/^-/) && next.trim() === '=' && isWholeValue(otherOpts[i + 2])) {
        newArray.push({ piece: { [curr]: parseWholeValue(otherOpts[i + 2]) } })
        i += 2
        continue
      }
      // console.log('prev', prev)
      if (curr.match(/^-+/)) {
        const cleanX = !isNegativeNumber(curr) ? curr.replace(/^-+/, '') : curr

        const nextItemIsOption = next.match(/^-+/) && !isNegativeNumber(next)

        if (currentIsSingleDashOption && isShortCluster(cleanX, parseOptions)) {
          for (let j = 0; j < cleanX.length; j++) {
            newArray.push(cleanX[j] + '=true ')
          }
          if (next.trim() === '=' && nextNext) {
            i += 2
          }
          continue
        }
        debug('cleanX', cleanX)
        if (cleanX && SIMPLE_KEY.test(cleanX)) {
          const rawNext = otherOpts[i + 1]
          if (next.trim() === '=' && isWholeValue(otherOpts[i + 2])) {
            newArray.push({ piece: { [cleanX]: parseWholeValue(otherOpts[i + 2]) } })
            i += 2
            continue
          }
          const nextIsQuotedValue = rawNext === ''
            || rawNext === '-'
            || (isShellQuoted(rawNext) && !rawNext.match(SHELL_QUOTED_KEY_VALUE))
          /* `--pat [abc --stage prod`: nothing can close the bracket, so it is a plain value */
          const nextIsUnclosedValue = next
            && !next.match(/^-/)
            && !next.includes('=')
            && isUnbalanced(next)
            && (i + 2 >= otherOpts.length || isOptionLike(nextNext))
          if (nextIsQuotedValue || nextIsUnclosedValue) {
            newArray.push({ piece: { [cleanX]: parseWholeValue(rawNext) } })
            i += 1
            continue
          }
        }
        if (nextItemIsOption || isLast) {
          if (cleanX.match(IS_KEY_VALUE_IN_QUOTES) || cleanX.match(IS_KEY_VALUE_START_WITH_QUOTE)) {
            newArray.push(cleanX + ' ')
          } else {
            newArray.push(cleanX + '=true ')
          }
          continue
        }

        // If the current option is the last option, don't add an equal sign
        let equal = ' '
        if (cleanX.indexOf('=') === -1 && !next.match(/=/)) {
          equal = '='
        }
        if (isLast) {
          equal = ' '
        }
        if (
          nextNext.trim() === '='
          // || nextNext.match(/=/)
        ) {
          equal = ' '
        }
        const final = cleanX + equal
        newArray.push(final)
        continue
      }
      if (typeof prev === 'string' && prev.match(/=\s?$/) && (curr.match(/^\s?=/) || curr.trim() === '=')) {
        continue
      }

      const trailingSpace = curr === '=' ? '' : ' '
      newArray.push(curr + trailingSpace)
    }
    debug('newArray', newArray)
    debug('rest', rest)
    /* Loose tokens are joined and re-split so forms like `word = bond` recover.
       Whole pieces break the run so nothing merges across them. */
    const optStringPieces = []
    let looseTokens = []
    const flushLooseTokens = () => {
      if (!looseTokens.length) return
      const optString = looseTokens.join('')
      looseTokens = []
      debug('optString', optString)
      const optParts = splitOutsideQuotes(optString)
      debug('optParts', optParts)
      optParts.filter(Boolean).forEach((x) => {
        debug('x', x)
        optStringPieces.push(parse(x))
      })
    }
    newArray.forEach((item) => {
      if (typeof item === 'string') {
        looseTokens.push(item)
        return
      }
      flushLooseTokens()
      optStringPieces.push(item.piece)
    })
    flushLooseTokens()
    debug('optStringPieces', optStringPieces)
    extraParse = mergeOptionPieces(optStringPieces, parseOptions)
    globGroups.forEach((group) => {
      if (
        group.rawKey
        && group.rawKey.match(/^-[^-]/)
        && group.key.length > 1
        && typeof extraParse[group.key] === 'undefined'
      ) {
        extraParse[group.key] = group.values.length === 1 ? group.values[0] : group.values
      }
    })

    const singleDashStrings = Array.from(new Set(
      findSingleDashStrings(rawArgv)
        .concat(findSingleDashStrings(otherOpts))
        .map((x) => x.replace(/^-+/, ''))
    ))
    debug('singleDashStrings', singleDashStrings)

    debug('before mriOptionsOriginal', mriOptionsOriginal)
    debug('before extraParse', extraParse)

    debug('stripSingleDashOptions', stripSingleDashOptions)

    if (singleDashStrings.length) {
      for (let i = 0; i < singleDashStrings.length; i++) {
        const curr = singleDashStrings[i]
        const parts = curr.split('=')
        const word = parts[0]
        const value = parts[1]
        const shouldStrip = (value) ? true : stripSingleDashOptions
        // Loop over all letters of single dash mriOptionsOriginal -word and remove any corresponding letter: true
        for (let j = 0; j < word.length; j++) {
          const letter = word[j]
          // console.log('letter', letter)
          if (shouldStrip && letter in mriOptionsClean) {
            delete mriOptionsClean[letter]
            mriDiff = true
          }
          if (mriOptionsClean[letter] === extraParse[word]) {
            /* Only an own key changes the object; deleting a missing one is a no-op */
            if (Object.prototype.hasOwnProperty.call(mriOptionsClean, letter)) {
              mriDiff = true
            }
            delete mriOptionsClean[letter]
          }
        }
      }
      debug('after mriOptionsOriginal', mriOptionsClean)
    }

    /*
    console.log('optStringArr', newArray)
    console.log('optString', optString)
    console.log('otherOpts strings', otherOpts)
    console.log('nicely handed CLI args')
    console.log('extraParse', extraParse)
    process.exit(1)
    /** */
  }

  const mergedOptions = {
    ...mriOptionsClean,
    ...extraParse,
  }
  delete mergedOptions._

  return {
    rawArgv: rawArgv.join(' '),
    leadingCommands,
    globGroups,
    extraParse,
    mriOptionsOriginal,
    mriOptionsClean,
    mriDiff,
    yargsParsed,
    mergedOptions
  }
}

function cleanOption(option = '') {
  return option.replace(/^-+/, '').trim()
}

function findSingleDashStrings(arr) {
  return arr.filter(str => str.match(/^-[^-]/) && !isNegativeNumber(str))
}


module.exports = {
  dxParse,
}
