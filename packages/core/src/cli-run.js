const path = require('path')
const fs = require('fs')
const { loadConfig } = require('./utils/load-config')
const { findUp } = require('./utils/fs')
const { markdownMagic } = require('./')
const { processFile } = require('comment-block-replacer')
const { parse } = require('oparser')
const defaultTransforms = require('./transforms')
const { getGlobGroupsFromArgs } = require('./globparse')
// const { deepLog } = require('./utils/logs')
// const { uxParse } = require('./argparse/argparse')
const argv = process.argv.slice(2)
const cwd = process.cwd()
const defaultConfigPath = 'md.config.js'

/**
 * Render markdown with ANSI styling for terminal output
 * @param {string} content
 */
// async function renderMarkdown(content) {
//   const { render, themes } = await import('markdansi')
//   const githubDark = {
//     ...themes.default,
//     heading: { color: 'white', bold: true },
//     strong: { bold: true },
//     emph: { italic: true },
//     inlineCode: { color: 'yellow' },
//     blockCode: { color: 'white' },
//     link: { color: 'cyan', underline: true },
//     quote: { color: 'gray', italic: true },
//     hr: { color: 'gray', dim: true },
//     listMarker: { color: 'blue' },
//     tableHeader: { color: 'white', bold: true },
//     tableCell: { color: 'white' },
//   }
//   return render(content, { theme: githubDark })
// }

/**
 * Read all data from stdin
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => data += chunk)
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

/**
 * Interpret escape sequences in string (e.g., \n -> newline)
 * @param {string} str
 * @returns {string}
 */
function interpretEscapes(str) {
  if (!str) return str
  return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}

/**
 * JSON.stringify replacer that handles RegExp objects
 * @param {string} key
 * @param {any} value
 */
function jsonReplacer(key, value) {
  if (value instanceof RegExp) {
    return value.toString()
  }
  return value
}

/**
 * Check if string looks like markdown content vs a file path
 * @param {string} str
 * @returns {boolean}
 */
function isMarkdownContent(str) {
  if (!str) return false
  // Has newlines (real or escaped) = likely content
  if (str.includes('\n') || str.includes('\\n')) return true
  // Has markdown comment blocks = likely content
  if (str.includes('<!--')) return true
  // Check if file exists
  try {
    if (fs.existsSync(str)) return false
  } catch (e) {
    // ignore
  }
  // Has markdown heading at start = likely content
  if (str.startsWith('#')) return true
  return false
}

async function getBaseDir(opts = {}) {
  const { currentDir = cwd } = opts
  const gitDir = await findUp(currentDir, '.git')
  return (gitDir) ? path.dirname(gitDir) : currentDir
}

function findSingleDashStrings(arr) {
  return arr.filter(str => str.match(/^-[^-]/))
}

async function runCli(options = {}, rawArgv) {
  if (options.help || options.h) {
    console.log(`
Usage: md-magic [options] [files...]

Options:
  --files, --file    Files or glob patterns to process
  --config           Path to config file (default: md.config.js)
  --output           Output directory
  --open             Opening comment keyword (default: docs)
  --close            Closing comment keyword (default: /docs)
  --json             Output full result as JSON
  --pretty           Render output with ANSI styling
  --dry              Dry run - show what would be changed
  --debug            Show debug output
  --help, -h         Show this help message
  --version, -v      Show version

Examples:
  md-magic README.md
  md-magic --files "**/*.md"
  md-magic --config ./my-config.js

Stdin/stdout mode:
  cat file.md | md-magic
  echo "<!-- docs TOC --><!-- /docs -->" | md-magic
  md-magic "# Title\\n<!-- docs TOC --><!-- /docs -->"
`)
    return
  }

  if (options.version || options.v) {
    // @ts-ignore
    const pkg = require('../package.json')
    console.log(`${pkg.name} v${pkg.version}`)
    return
  }

  // Check if first positional arg is markdown content (before stdin check)
  // Handle case where mri assigns content to a flag (e.g., --json '# content')
  let firstArg = options._ && options._[0]
  const outputJson = options.json === true || (typeof options.json === 'string' && isMarkdownContent(options.json))
  if (typeof options.json === 'string' && isMarkdownContent(options.json)) {
    firstArg = options.json
  }
  const openKeyword = options.open || 'docs'
  const closeKeyword = options.close || (options.open && options.open !== 'docs' ? `/${options.open}` : '/docs')
  if (firstArg && isMarkdownContent(firstArg)) {
    const content = interpretEscapes(firstArg)
    const result = await processFile({
      content,
      syntax: 'md',
      open: openKeyword,
      close: closeKeyword,
      transforms: defaultTransforms,
      dryRun: true,
    })
    console.log('result', result)
    if (outputJson) {
      console.log(JSON.stringify(result, jsonReplacer, 2))
    } else {
      console.log(result.updatedContents)
    }
    return
  }

  // Check for stdin pipe (when no positional file args provided)
  const hasNoFileArgs = !options._ || options._.length === 0
  const hasPipedInput = !process.stdin.isTTY && hasNoFileArgs
  if (hasPipedInput) {
    const content = await readStdin()
    if (content.trim()) {
      const result = await processFile({
        content,
        syntax: 'md',
        open: openKeyword,
        close: closeKeyword,
        transforms: defaultTransforms,
        dryRun: true, // Don't write files
      })
      if (outputJson) {
        console.log(JSON.stringify(result, jsonReplacer, 2))
      } else {
        console.log(result.updatedContents)
      }
      return
    }
  }

  let configFile
  let opts = {}

  /*
  const result = uxParse(rawArgv)
  console.log('───────────────────────────────')
  deepLog(result)
  process.exit(1)
  // process.exit(1)
  /** */

  /*
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
    // console.log('singleDashStrings', singleDashStrings)
    // console.log('before options', options)
    // console.log('before extraParse', extraParse)
    
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
      // console.log('after options', options)
    }

    if (extraParse.test) {
      /*
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
  /*
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
  runCli
}