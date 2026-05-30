const path = require('path')
const fs = require('fs')
const { loadConfig } = require('./utils/load-config')
const { findUp } = require('./utils/fs')
const { markdownMagic } = require('./')
const { processFile } = require('comment-block-replacer')
const defaultTransforms = require('./transforms')
const { dxParse, getGlobGroupsFromArgs } = require('@davidwells/dx-args')
const argv = process.argv.slice(2)
const cwd = process.cwd()
const defaultConfigPaths = ['md.config.js', 'markdown.config.js']

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

/**
 * Find the first config file that exists in parent dirs
 * @param {string} baseDir
 * @param {Array<string>} configPaths
 * @returns {Promise<string|undefined>}
 */
async function findFirstConfig(baseDir, configPaths = []) {
  for (let i = 0; i < configPaths.length; i++) {
    const configPath = configPaths[i]
    const found = await findUp(baseDir, configPath)
    if (found) {
      return found
    }
  }
}

async function runCli(options = {}, rawArgv, deps = {}) {
  if (options.help || options.h) {
    console.log(`
Usage: md-magic [options] [files...]

Options:
  --files, --file, --path
                      Files or glob patterns to process
  --config           Path to config file (default: md.config.js or markdown.config.js)
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
  md-magic --path "**/*.md"   # alias for --files
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

  const cliArgv = Array.isArray(rawArgv) ? rawArgv : argv
  if (cliArgv.length) {
    opts = parseCliArgv(cliArgv)
  }
  if (opts.config) {
    configFile = opts.config
  } else {
    const baseDir = await getBaseDir()
    configFile = await findFirstConfig(baseDir, defaultConfigPaths)
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
  const runMarkdownMagic = deps.markdownMagic || markdownMagic
  return runMarkdownMagic(mergedConfig)
}

function parseCliArgv(rawArgv = []) {
  return normalizeCliOptions(dxParse(rawArgv, {
    globKeys: ['files', 'file', 'path', 'ignore']
  }))
}

function normalizeCliOptions(parsed) {
  const mergedOptions = parsed.mergedOptions || {}
  const opts = {
    ...mergedOptions,
    files: []
  }
  const globGroupByKey = parsed.globGroups.reduce((acc, curr) => {
    acc[curr.key] = curr
    return acc
  }, {})

  if (globGroupByKey.file) {
    opts.files = opts.files.concat(globGroupByKey.file.values)
  }
  if (globGroupByKey.files) {
    opts.files = opts.files.concat(globGroupByKey.files.values)
  }
  if (globGroupByKey.path) {
    opts.files = opts.files.concat(globGroupByKey.path.values)
  }
  if (globGroupByKey['']) {
    opts.files = opts.files.concat(globGroupByKey[''].values)
  }
  if (globGroupByKey.ignore) {
    opts.ignore = globGroupByKey.ignore.values
  }

  if (mergedOptions.file) {
    opts.files = opts.files.concat(mergedOptions.file)
    delete opts.file
  }
  if (mergedOptions.files) {
    opts.files = opts.files.concat(mergedOptions.files)
  }
  if (mergedOptions.path) {
    opts.files = opts.files.concat(mergedOptions.path)
    delete opts.path
  }
  if (mergedOptions['--files']) {
    opts.files = opts.files.concat(mergedOptions['--files'])
    delete opts['--files']
  }

  delete opts._
  delete opts.file
  delete opts.path
  opts.files = normalizeFileList(opts.files)
  return opts
}

function normalizeFileList(files = []) {
  return files.map((x) => {
    if (typeof x === 'string' && x.match(/,/)) {
      return x.split(',')
    }
    return x
  })
  .flat()
  .filter(onlyUnique)
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

module.exports = {
  getGlobGroupsFromArgs,
  parseCliArgv,
  normalizeCliOptions,
  runCli
}
