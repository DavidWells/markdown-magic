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
const IS_INTEGER = /^-?\d*(\.(?=\d))?\d*$/

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
  return /^-\d/g.test(input)
}

function uxParse(_rawArgv = [], opts = {}) {
  /* Trim empty strings */
  const { stripSingleDashOptions = true } = opts
  const rawArgv = _rawArgv.filter(x => x !== '')
  let mriOptionsOriginal = mri(rawArgv)

  const yargsParsed = 'not enabled' //yargs(_rawArgv).parse()
  let extraParse = {}
  let globGroups = []
  const mriOptionsClean = Object.assign({}, mriOptionsOriginal)

  const _singleDashOptions = findSingleDashStrings(rawArgv)
  console.log('_singleDashOptions', _singleDashOptions)

  // Get all leading CLI commands that are strings that are not options. Stop if option is found
  const leadingCommands = []
  for (let i = 0; i < rawArgv.length; i++) {
    const curr = rawArgv[i]
    if (typeof curr === 'string' && !curr.match(/^-/) && !curr.match(IS_KEY_VALUE_START_WITH_QUOTE)) {
      leadingCommands.push(curr)
    } else {
      break
    }
  }
  console.log('leadingCommands', leadingCommands)

  if (!rawArgv || !rawArgv.length) {
    return {
      leadingCommands,
      extraParse,
      mriOptionsOriginal,
      globGroups
    }
  }
  //*
  console.log('rawArgv', rawArgv)
  console.log('mri mriOptionsOriginal', mriOptionsOriginal)
  const counter = {}
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
      globKeys: ['files', 'file']
    })
    globGroups = globParse.globGroups
    const { otherOpts } = globParse
    console.log('globGroups', globGroups)
    /*
    
    console.log('globParse', globParse)
    // deepLog(globParse)
    process.exit(1)
    /** */
    /* Parse for weird CLI inputs */

    /* Handle -- and - flags */

    console.log('left over otherOpts after globParse', otherOpts)
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
      const isFirst = i === 0
      const opt = cleanOption(curr)
      console.log('--------------------------------')
      console.log(`current  "${curr}"`)
      console.log(`cleaned  "${opt}"`)
      console.log(`previous "${opt}"`, prev)
      console.log(`next for "${opt}"`, next)
      console.log(`nextNext "${opt}"`, nextNext)
      console.log('--------------------------------')

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
        console.log('single dash option', curr)
        currentIsSingleDashOption = true
      }
      if (currIsNegativeNumber) {
        newArray.push(curr)
        continue
      }
      // console.log('prev', prev)
      if (curr.match(/^-+/)) {
        const cleanX = !isNegativeNumber(curr) ? curr.replace(/^-+/, '') : curr

        const nextItemIsOption = next.match(/^-+/)

        if (currentIsSingleDashOption && nextItemIsOption && cleanX.length < 4) {
          continue
        }
        console.log('cleanX', cleanX)
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
    console.log('newArray', newArray)
    console.log('rest', rest)
    const optString = newArray.join('')
    console.log('optString', optString)
    extraParse = parse(optString)
    const optParts = splitOutsideQuotes(optString)
    console.log('optParts', optParts)
    const optStringPieces = optParts
      .filter(Boolean)
      .map((x) => {
        console.log('x', x)
        return parse(x)
      })
    console.log('optStringPieces', optStringPieces)
    
    for (let i = 0; i < optStringPieces.length; i++) {
      const curr = optStringPieces[i]
      const key = Object.keys(curr)[0]
      if (counter[key]) {
        counter[key]++
      } else {
        counter[key] = 1
      }
    }
    console.log('optStringPieces counter', counter)

    const propertiesSetMoreThanOnce = Object.keys(counter).filter((x) => counter[x] > 1)
    console.log('propertiesSetMoreThanOnce', propertiesSetMoreThanOnce)
    const singleDashStrings = findSingleDashStrings(otherOpts).map((x) => x.replace(/^-+/, ''))
    console.log('singleDashStrings', singleDashStrings)
    // find any duplicate values in singleDashStrings. means its an array
    const duplicateValues = singleDashStrings.filter((x, index) => singleDashStrings.indexOf(x) !== index)
    console.log('duplicateValues', duplicateValues)
    if (propertiesSetMoreThanOnce.length) {
      console.log('duplicateValues', propertiesSetMoreThanOnce)
      for (let i = 0; i < propertiesSetMoreThanOnce.length; i++) {
        const curr = propertiesSetMoreThanOnce[i]
        console.log('curr', curr)
        // get all array items with key of curr
        const arrayItems = optStringPieces.filter((x) => Object.keys(x)[0] === curr)
        console.log('arrayItems', arrayItems)
        // Set to extraParse as an array
        extraParse[curr] = arrayItems.map((x) => x[curr])
        // Make the array items unique
        extraParse[curr] = [...new Set(extraParse[curr])]
      }
    }

    console.log('before mriOptionsOriginal', mriOptionsOriginal)
    console.log('before extraParse', extraParse)


    console.log('stripSingleDashOptions', stripSingleDashOptions)
    // const STRIP_SINGLE_DASH_OPTIONS = stripSingleDashOptions
    const STRIP_SINGLE_DASH_OPTIONS = false
    
    if (singleDashStrings.length) {
      for (let i = 0; i < singleDashStrings.length; i++) {
        const curr = singleDashStrings[i]
        const parts = curr.split('=')
        const word = parts[0]
        const value = parts[1]
        const shouldStrip = (value) ? true : STRIP_SINGLE_DASH_OPTIONS
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
      console.log('after mriOptionsOriginal', mriOptionsClean)
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

  // @TODO hoist this bc we are do it earlier
  Object.keys(mergedOptions).forEach((key) => {
    const count = counter[key]
    if (count && key.length > 1 && count > 1) {
      console.log(`key "${key}" count ${count}`)
      const value = Array.isArray(extraParse[key]) ? extraParse[key] : mriOptionsOriginal[key]
      console.log('value', value)
      if (Array.isArray(value)) {
        mergedOptions[key] = value
      }
    }
  })

  return {
    rawArgv: rawArgv.join(' '),
    leadingCommands,
    globGroups,
    extraParse,
    mriOptionsOriginal,
    mriOptionsClean,
    mriDiff: mriOptionsOriginal !== mriOptionsClean,
    yargsParsed,
    mergedOptions
  }
}

function cleanOption(option = '') {
  return option.replace(/^-+/, '').trim()
}

function findSingleDashStrings(arr) {
  return arr.filter(str => str.match(/^-[^-]/))
}


module.exports = {
  uxParse,
}