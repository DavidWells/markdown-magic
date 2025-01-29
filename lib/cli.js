
const path = require('path')
const isGlob = require('is-glob')
const isValidFilePath = require('is-valid-path')
const { loadConfig } = require('./utils/load-config')
const { findUp } = require('./utils/fs')
const { markdownMagic } = require('./')
const { parse } = require('oparser')
const { deepLog } = require('./utils/logs')
const { REGEX_REGEX, escapeRegexString } = require('./utils/regex')
const { getFirstCharacter, isUpperCase } = require('./utils/text')
const { uxParse } = require('./argparse')
const argv = process.argv.slice(2)
const mri = require('mri')
const cwd = process.cwd()
const defaultConfigPath = 'md.config.js'

const ARRAY_REGEX = /^\[(.*)\]$/
const NOT_OBJECT_LIKE = /^{[^:,]*}/
const IS_KEY_VALUE_NON_ARRAY = /^([A-Za-z0-9_]*)=\s?([^\[\{]]*)([^\[\{]*)$/
const IS_KEY_VALUE_IN_QUOTES = /^([A-Za-z0-9_]*)=\s?("|')(.*)(\2)$/
const IS_KEY_VALUE_START_WITH_QUOTE = /^([A-Za-z0-9_]*)=\s?("|')(.*)/
exports.IS_KEY_VALUE_IN_QUOTES = IS_KEY_VALUE_IN_QUOTES

function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(ARRAY_REGEX.test(str))
}

async function getBaseDir(opts = {}) {
  const { currentDir = cwd } = opts
  const gitDir = await findUp(currentDir, '.git')
  return (gitDir) ? path.dirname(gitDir) : currentDir
}

function stringLooksLikeFile(value) {
  return !value.match(/^-+/) // isn't option looking
  && isValidFilePath(value)
  && (
    path.basename(value).indexOf('.') > -1 // has period
    || getFirstCharacter(value) === '_' // starts with _
    // || isUpperCase(value) // is all caps
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
    // uniquify returned array
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

/*
node ./cli.js test/fixtures/md/**.md debug --transform test/fixtures/md/transform-**.md 1233535235 = hahah funky=hi --ignore test/fixtures/output/**.md --lol --whatever test/fixtures/md/syntax-**.md --foo=bar --fun lol.md what=no.md x 'xno.md' what
*/
function getGlobGroupsFromArgs(args, opts = {}) {
  const globKeys = opts.globKeys || []
  let preceding = ['', '']
  let collection = []
  let globGroups = []
  let reserved = []
  let otherOpts = []
  let /** @type {string|undefined} */ cacheKey = ''
  // console.log('args', args)
  for (let i = 0; i < args.length; i++) {
    const isLastArg = (args.length - 1) === i
    const arg = args[i]
    const prevArg = args[i - 1]
    const looksLikeFile = stringLooksLikeFile(arg) // @TODO verify file exists?
    
    // console.log('arg', arg)
    // console.log('looksLikeFile', looksLikeFile) 
    // console.log('collection', collection)

    // console.log('cacheKey', cacheKey)

    if (looksLikeFile && typeof cacheKey !== 'undefined') {      
      // @TODO verify file exists?
      collection.push(arg)
    } else if (arg.match(/^-+/) && !arg.match(/=/)) {
      cacheKey = arg
      // console.log('cacheKey', cacheKey)
      // console.log('collection', collection)
      // console.log('arg', arg)
      if (collection.length) {
        const val = getValue(preceding)
        // console.log('val', val)
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
      // console.log('FOOO', arg)
      cacheKey = undefined
    }

    const cleanKey = trimLeadingDashes(cacheKey || '')
    const isDefinedGlobKey = globKeys.includes(cleanKey) || globKeys.includes(cacheKey)
    // console.log(`isDefinedGlobKey: ${cleanKey}`, isDefinedGlobKey)
    if (isDefinedGlobKey && (isGlob(arg) || looksLikeFile)) {
      /*
      console.log('ADD collection.push', arg)
      /** */
      collection = addValue(arg, collection)
    } else {
      const notObjectLike = arg.match(NOT_OBJECT_LIKE) && !isArrayLike(arg)
      // console.log('notObjectLike', notObjectLike)
      if (
        (notObjectLike) ||
        !cacheKey && customIsGlob(arg) && !arg.match(/=/)
      ) {
        // console.log('GLOB MATCH', arg, isGlob(arg))
        collection = addValue(arg, collection)
      } else if (!looksLikeFile) {
        /* Pass through non matching args */
        /*
        console.log('ADD otherOpts', arg)
        /** */
        if (arg.match(IS_KEY_VALUE_IN_QUOTES) || arg.match(IS_KEY_VALUE_START_WITH_QUOTE)) {
          // otherOpts.push(arg.replace(IS_KEY_VALUE_IN_QUOTES, '$1=$2$3$4'))
          otherOpts.push(arg)
        } else if (arg.match(IS_KEY_VALUE_NON_ARRAY)) {
          // quote quote wrap
          otherOpts.push(arg.replace(IS_KEY_VALUE_NON_ARRAY, '$1="$2$3"'))
        } else {
          otherOpts.push(arg)
        }

      }
    }
    
    // console.log('end', collection)
    if (isLastArg && collection.length) {
      // console.log('isLastArg', isLastArg)
      const val = getValue(preceding)
      reserved.push(val)
      globGroups.push({
        key: trimLeadingDashes(val),
        rawKey: val,
        values: collection.filter(removeNodeModules).map((x) => coerceStringToRegex(x)),
        // last: 'last'
      })
      collection = []
    }
  }

  return {
    globGroups,
    otherOpts: otherOpts.filter((opt) => !reserved.includes(opt))
  }
}

function findSingleDashStrings(arr) {
  return arr.filter(str => str.match(/^-[^-]/))
}
exports.findSingleDashStrings = findSingleDashStrings


async function runCli(options = {}, rawArgv) {
  let configFile
  let opts = {}

  const result = uxParse(options, rawArgv)
  console.log('result', result)
  process.exit(1)
  //*
  console.log('argv', argv)
  console.log('options', options)
  /** */
  options.files = []
  /* If raw args found, process them further */
  if (argv.length && (options._ && options._.length || (options.file || options.files))) {
    // if (isGlob(argv[0])) {
    //   console.log('glob', argv[0])
    //   options.glob = argv[0]
    // }
    const globParse = getGlobGroupsFromArgs(argv, {
      /* CLI args that should be glob keys */
      globKeys: ['files', 'file']
    })
    const { globGroups, otherOpts } = globParse
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
      const isLast = otherOpts.length === i + 1
      // console.log('curr', curr)
      // console.log('prev', prev)
      if (curr.match(/^-+/)) {
        const cleanX = curr.replace(/^-+/, '')
        if (next.match(/^-+/) || isLast) {
          newArray.push(cleanX + '= true ')
          continue
        }
        // If the current option is the last option, don't add an equal sign
        const equal = (cleanX.indexOf('=') === -1 || isLast) ? '=' : ' '
        const final = cleanX + equal
        newArray.push(final)
        continue
      }
      if (prev && prev.match(/=\s?$/) && (curr.match(/^\s?=/) || curr.trim() === '=')) {
        continue
      }
      newArray.push(curr + ' ')
    }

    const optString = newArray.join('')
    const extraParse = parse(optString)
    const singleDashStrings = findSingleDashStrings(otherOpts).map((x) => x.replace(/^-+/, ''))
    console.log('singleDashStrings', singleDashStrings)
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

    if (extraParse.test) {
      //*
      console.log('optStringArr', newArray)
      console.log('optString', optString)
      console.log('otherOpts strings', otherOpts)
      console.log('nicely handed CLI args')
      console.log('extraParse', extraParse)
      process.exit(1)
      /** */
    }
  

    if (globGroups.length) {
      const globGroupByKey = globGroups.reduce((acc, curr, i) => {
        acc[curr.key] = globGroups[i]
        return acc
      }, {})
      // console.log('globGroupByKey', globGroupByKey)

  
      if (globGroupByKey.file) {
        options.files = options.files.concat(globGroupByKey.file.values)
        delete options.file
      }
      if (globGroupByKey.files) {
        options.files = options.files.concat(globGroupByKey.files.values)
      } 
      if (globGroupByKey['']) {
        options.files = options.files.concat(globGroupByKey[''].values)
      }

      if (globGroupByKey.ignore) {
        options.ignore = globGroupByKey.ignore.values
      }
      
      /*
      deepLog(options)
      /** */
    }

    if (extraParse.file) {
      options.files = options.files.concat(extraParse.file)
      delete extraParse.file
    }

    if (extraParse.files) {
      options.files = options.files.concat(extraParse.files)
      delete extraParse.files
    }

    if (extraParse['--files']) {
      options.files = options.files.concat(extraParse['--files'])
      delete extraParse['--files']
    }

    // console.log('options.files', options.files)

    options.files = options.files.map((x) => {
      if (typeof x === 'string' && x.match(/,/)) {
        return x.split(',')
      }
      return x
    })
    .flat()
    .filter(onlyUnique)

    delete options._
    opts = {
      ...options,
      ...extraParse
    }
    //console.log('opts', opts)
  }
  if (opts.config) {
    configFile = opts.config
  } else {
    const baseDir = await getBaseDir()
    configFile = await findUp(baseDir, defaultConfigPath)
  }
  const config = (configFile) ? loadConfig(configFile) : {}
  const mergedConfig = {
    ...config,
    ...opts,
  }

  if (mergedConfig.output || mergedConfig.outputDir) {
    mergedConfig.outputDir = mergedConfig.output || mergedConfig.outputDir
  }
  //*
  console.log('rawArgv', rawArgv)
  console.log('mergedConfig', mergedConfig)
  process.exit(1)
  // return
  /** */
  return markdownMagic(mergedConfig)
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

module.exports = {
  getGlobGroupsFromArgs,
  uxParse,
  runCli
}