const mri = require('mri')
const { parse } = require('oparser')
const { getGlobGroupsFromArgs } = require('./globparse')

const IS_KEY_VALUE_IN_QUOTES = /^([A-Za-z0-9_]*)=\s?("|')(.*)(\2)$/
const IS_KEY_VALUE_START_WITH_QUOTE = /^([A-Za-z0-9_]*)=\s?("|')?(.*)/

function uxParse(_options = {}, _rawArgv) {
  /* Trim empty strings */
  const rawArgv = _rawArgv.filter(x => x !== '')
  let options = mri(rawArgv)
  let extraParse = {}
  let globGroups = []

  console.log('rawArgv', rawArgv)

  if (!rawArgv || !rawArgv.length) {
    return {
      extraParse,
      options,
      globGroups
    }
  }
  //*
  console.log('rawArgv', rawArgv)
  console.log('mri options', options)
  const counter = {}
  /** */
  /* If raw args found, process them further */
  if (
    rawArgv.length 
    // && (options._ && options._.length || (options.file || options.files))
  ) {
    // if (isGlob(rawArgv[0])) {
    //   console.log('glob', rawArgv[0])
    //   options.glob = rawArgv[0]
    // }
    const globParse = getGlobGroupsFromArgs(rawArgv, {
      /* CLI args that should be glob keys */
      globKeys: ['files', 'file']
    })
    globGroups = globParse.globGroups
    const { otherOpts } = globParse
    /*
    console.log('globGroups', globGroups)
    console.log('globParse', globParse)
    // deepLog(globParse)
    process.exit(1)
    /** */
    /* Parse for weird CLI inputs */

    /* Handle -- and - flags */
    let newArray = [] 
    for (let i = 0; i < otherOpts.length; i++) {
      const curr = otherOpts[i]
      const prev = newArray[i - 1]
      const next = otherOpts[i + 1] || ''
      const nextNext = otherOpts[i + 2] || ''
      const isLast = otherOpts.length === i + 1
      // console.log('curr', curr)
      // console.log('prev', prev)
      if (curr.match(/^-+/)) {
        const cleanX = curr.replace(/^-+/, '')
        if (next.match(/^-+/) || isLast) {
          if (cleanX.match(IS_KEY_VALUE_IN_QUOTES) || cleanX.match(IS_KEY_VALUE_START_WITH_QUOTE)) {
            newArray.push(cleanX + ' ')
          } else {
            newArray.push(cleanX + '= true ')
          }
          continue
        }
        console.log('cleanX', cleanX)
        console.log(`next ${cleanX}`, next)
        console.log('nextNext', nextNext)
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
      newArray.push(curr + ' ')
    }
    console.log('newArray', newArray)
    const optString = newArray.join('')
    console.log('otherOpts', otherOpts)
    console.log('optString', optString)
    extraParse = parse(optString)
    const optStringPieces = optString.split(' ').filter(Boolean).map((x) => parse(x))
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

    const singleDashStrings = findSingleDashStrings(otherOpts).map((x) => x.replace(/^-+/, ''))
    console.log('singleDashStrings', singleDashStrings)
    // find any duplicate values in singleDashStrings. means its an array
    const duplicateValues = singleDashStrings.filter((x, index) => singleDashStrings.indexOf(x) !== index)

    if (duplicateValues.length) {
      console.log('duplicateValues', duplicateValues)
      for (let i = 0; i < duplicateValues.length; i++) {
        const curr = duplicateValues[i]
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

    console.log('before options', options)
    console.log('before extraParse', extraParse)
    const STRIP_SINGLE_DASH_OPTIONS = true
    if (STRIP_SINGLE_DASH_OPTIONS && singleDashStrings.length) {
      for (let i = 0; i < singleDashStrings.length; i++) {
        const word = singleDashStrings[i]
        // Loop over all letters of single dash options -word and remove any corresponding letter: true
        for (let j = 0; j < word.length; j++) {
          const letter = word[j]
          if (options[letter]) {
            delete options[letter]
          }
        }
      }
      console.log('after options', options)
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
    ...options,
    ...extraParse,
  }
  delete mergedOptions._

  // @TODO hoist this bc we are do it earlier
  Object.keys(mergedOptions).forEach((key) => {
    const count = counter[key]
    console.log('count', count)
    if (key.length > 1 && count > 1) {
      console.log('key', key) 
      const value = options[key] || extraParse[key]
      console.log('value', value)
      if (Array.isArray(value)) {
        mergedOptions[key] = value
      }
    }
  })

  return {
    rawArgv: rawArgv.join(' '),
    globGroups,
    extraParse,
    options,
    mergedOptions
  }
}

function findSingleDashStrings(arr) {
  return arr.filter(str => str.match(/^-[^-]/))
}


module.exports = {
  uxParse
}