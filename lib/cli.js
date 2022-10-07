
const path = require('path')
const mri = require('mri')
const isGlob = require('is-glob')
const isValidFilePath = require('is-valid-path')
const { loadConfig } = require('./utils/load-config')
const { findUp } = require('./utils/fs')
const { markdownMagic } = require('./')
const optionsParser = require('./options-parser')
const { deepLog } = require('./utils/logs')
const { REGEX_REGEX, escapeRegexString } = require('./utils/regex')
const { getFirstCharacter, isUpperCase } = require('./utils/text')
const argv = process.argv.slice(2)
const cliArgs = mri(argv)
const cwd = process.cwd()
const defaultConfigPath = 'md.config.js'

async function getBaseDir(currentDir = cwd) {
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

function isArrayLike(str) {
  if (typeof str !== 'string') return false
  return Boolean(str.match(/^\[(.*)\]$/))
}

function coerceStringToRegex(str) {
  const isRegex = str.match(REGEX_REGEX)
  if (isRegex) {
    const [ match, pattern, flags ] = isRegex
    return new RegExp(escapeRegexString(pattern, flags))
  }
  return str
}

function convertToArray(str = '') {
  const { fixedArray } = optionsParser(`fixedArray=${str}`)
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

/*
node ./cli.js test/fixtures/md/**.md debug --transform test/fixtures/md/transform-**.md 1233535235 = hahah funky=hi --ignore test/fixtures/output/**.md --lol --whatever test/fixtures/md/syntax-**.md --foo=bar --fun lol.md what=no.md x 'xno.md' what
*/
function getGlobGroupsFromArgs(args, opts = {}) {
  const globKeys = opts.globKeys || []
  let proceding = ['', '']
  let collection = []
  let globGroups = []
  let reserved = []
  let otherOpts = []
  let cacheKey = ''
  for (let i = 0; i < args.length; i++) {
    const isLastArg = (args.length - 1) === i
    const arg = args[i]
    const prevArg = args[i - 1]
    const looksLikeFile = stringLooksLikeFile(arg) // @TODO verify file exists?
    // console.log('looksLikeFile', looksLikeFile)  
    // console.log('cacheKey', cacheKey)
    // console.log('arg', arg)

    if (looksLikeFile && typeof cacheKey !== 'undefined') {      
      // @TODO verify file exists?
      collection.push(arg)
    } else if (arg.match(/^-+/)) {
      cacheKey = arg
      if (collection.length) {
        const val = getValue(proceding)
        reserved.push(val)
        globGroups.push({
          key: trimLeadingDashes(val),
          raw: val,
          values: collection.filter(removeNodeModules).map((x) => coerceStringToRegex(x))
        })
        collection = []
      }
      proceding = [ prevArg, arg ]
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
      if (!cacheKey && isGlob(arg)) {
        collection = addValue(arg, collection)
      } else if (!looksLikeFile) {
        /* Pass through non matching args */
        /*
        console.log('ADD otherOpts', arg)
        /** */
        otherOpts.push(arg)
      }
    }

    if (isLastArg && collection.length) {
      const val = getValue(proceding)
      reserved.push(val)
      globGroups.push({
        key: trimLeadingDashes(val),
        raw: val,
        values: collection.filter(removeNodeModules).map((x) => coerceStringToRegex(x))
      })
      collection = []
    }
  }

  return {
    globGroups,
    otherOpts: otherOpts.filter((opt) => !reserved.includes(opt))
  }
}

// const unique = Array.from(new Set(dismiss.concat(nodeSlug)))


async function runCli(options = {}) {
  let configFile
  let opts = {}
  /*
  console.log('argv', argv)
  console.log('options', options)
  /** */
  /* If raw args found, process them further */
  if (argv.length && options._ && options._.length) {
    // if (isGlob(argv[0])) {
    //   console.log('glob', argv[0])
    //   options.glob = argv[0]
    // }
    const globParse = getGlobGroupsFromArgs(argv, {
      // CLI args that should be glob keys
      globKeys: ['files', 'file']
    })
    const { globGroups, otherOpts } = globParse
    deepLog(globParse)

    if (globGroups.length) {
      const globGroupByKey = globGroups.reduce((acc, curr, i) => {
        acc[curr.key] = globGroups[i]
        return acc
      }, {})
      // console.log('globGroupByKey', globGroupByKey)

      if (globGroupByKey.file) {
        options.glob = globGroupByKey.file.values
      } else if (globGroupByKey['']) {
        options.glob = globGroupByKey[''].values
      }

      if (globGroupByKey.ignore) {
        options.ignore = globGroupByKey.ignore.values
      }

      deepLog(options)
    }

    /* Parse for weird CLI inputs */
    const extraParse = optionsParser(otherOpts.join(' '))

    /*
    console.log('otherOpts', otherOpts)
    console.log('extraParse', extraParse)
    /** */

    delete options._
    opts = {
      ...options,
      ...extraParse
    }
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
  /*
  console.log('mergedConfig', mergedConfig)
  return
  /** */
  await markdownMagic(mergedConfig)
}

// runCli(cliArgs)

module.exports = {
  getGlobGroupsFromArgs,
  runCli
}