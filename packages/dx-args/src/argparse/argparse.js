const mri = require('mri')
const { parse } = require('oparser')
const { getGlobGroupsFromArgs } = require('../globparse')
const { splitOutsideQuotes } = require('./splitOutsideQuotes')
/*
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
// process.exit(1)
/** */

const IS_KEY_VALUE_IN_QUOTES = /^([A-Za-z0-9_.]*)=\s?("|')(.*)(\2)$/
const IS_KEY_VALUE_START_WITH_QUOTE = /^([A-Za-z0-9_.]*)=\s?("|')?(.*)/
const IS_NEGATIVE_NUMBER = /^-\d/

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
  const keys = opts.accumulate || opts.accumulateFlags || opts.arrayKeys || []
  if (Array.isArray(keys)) {
    return new Set(keys)
  }
  return new Set(Object.keys(keys).filter((key) => keys[key]))
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
    const normalized = normalizeNoPrefix(rawKey, piece[rawKey], opts)
    if (accumulatorKeys.has(normalized.key)) {
      acc[normalized.key] = (acc[normalized.key] || []).concat(normalized.value)
    } else {
      acc[normalized.key] = normalized.value
    }
    return acc
  }, {})
}

function hasObjectDiff(left, right) {
  return JSON.stringify(left) !== JSON.stringify(right)
}

function getLeadingCommands(args = []) {
  const leadingCommands = []
  for (let i = 0; i < args.length; i++) {
    const curr = args[i]
    const next = args[i + 1] || ''
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
  /* Trim empty strings */
  const parseOptions = normalizeParseOptions(opts)
  const { stripSingleDashOptions = true } = parseOptions
  const debug = parseOptions.debug ? console.log : () => {}
  const rawArgv = _rawArgv.filter(x => x !== '')
  let mriOptionsOriginal = mri(rawArgv)

  const yargsParsed = 'not enabled' //yargs(_rawArgv).parse()
  let extraParse = {}
  let globGroups = []
  let leadingCommands = []
  const mriOptionsClean = Object.assign({}, mriOptionsOriginal)

  const _singleDashOptions = findSingleDashStrings(rawArgv)
  debug('_singleDashOptions', _singleDashOptions)

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
      globKeys: parseOptions.globKeys
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
      const curr = otherOpts[i].trim()
      const currIsNegativeNumber = isNegativeNumber(curr)
      const prev = newArray[i - 1]
      const next = otherOpts[i + 1] || ''
      const nextNext = otherOpts[i + 2] || ''
      const isLast = otherOpts.length === i + 1
      const opt = cleanOption(curr)
      debug('--------------------------------')
      debug(`current  "${curr}"`)
      debug(`cleaned  "${opt}"`)
      debug(`previous "${opt}"`, prev)
      debug(`next for "${opt}"`, next)
      debug(`nextNext "${opt}"`, nextNext)
      debug('--------------------------------')

      if (dashDashSet) {
        rest.push(curr)
        continue
      }

      if (curr === '--') {
        dashDashSet = true
        continue
      }

      let currentIsSingleDashOption = false
      if (curr.match(/^-[^-]/) && !currIsNegativeNumber) {
        debug('single dash option', curr)
        currentIsSingleDashOption = true
      }
      if (currIsNegativeNumber) {
        newArray.push(curr)
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
      if (prev && prev.match(/=\s?$/) && (curr.match(/^\s?=/) || curr.trim() === '=')) {
        continue
      }

      const trailingSpace = curr === '=' ? '' : ' '
      newArray.push(curr + trailingSpace)
    }
    debug('newArray', newArray)
    debug('rest', rest)
    const optString = newArray.join('')
    debug('optString', optString)
    const optParts = splitOutsideQuotes(optString)
    debug('optParts', optParts)
    const optStringPieces = optParts
      .filter(Boolean)
      .map((x) => {
        debug('x', x)
        return parse(x)
      })
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
          if (shouldStrip && mriOptionsClean[letter]) {
            delete mriOptionsClean[letter]
          }
          if (mriOptionsClean[letter] === extraParse[word]) {
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
    mriDiff: hasObjectDiff(mriOptionsOriginal, mriOptionsClean),
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
