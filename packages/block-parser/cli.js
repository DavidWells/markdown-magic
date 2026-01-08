#!/usr/bin/env node
// CLI for parsing comment blocks from markdown and other files
const mri = require('mri')
const { parseBlocks } = require('./src/index')

const argv = process.argv.slice(2)
const options = mri(argv)

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
 * @param {string} _key
 * @param {any} value
 */
function jsonReplacer(_key, value) {
  if (value instanceof RegExp) {
    return value.toString()
  }
  return value
}

/**
 * Check if string looks like content vs a file path
 * @param {string} str
 * @returns {boolean}
 */
function isContent(str) {
  if (!str) return false
  if (str.includes('\n') || str.includes('\\n')) return true
  if (str.includes('<!--')) return true
  if (str.startsWith('#')) return true
  return false
}

async function run() {
  if (options.help || options.h) {
    console.log(`
Usage: block-parser [options] [content]

Options:
  --open             Opening comment keyword (default: block)
  --close            Closing comment keyword (default: /block)
  --syntax           Comment syntax: md, js, html, etc (default: md)
  --help, -h         Show this help message
  --version, -v      Show version

Examples:
  block-parser "# Title\\n<!-- block -->content<!-- /block -->"
  echo "<!-- block enabled --><!-- /block -->" | block-parser
  block-parser --open auto --close /auto "<!-- auto isCool --><!-- /auto -->"
`)
    return
  }

  if (options.version || options.v) {
    const pkg = require('./package.json')
    console.log(`${pkg.name} v${pkg.version}`)
    return
  }
  
  const word = options.open || options.match || options.find
  const openKeyword = word || 'block'
  const closeKeyword = options.close || (word ? `/${word}` : '/block')
  const syntax = options.syntax || 'md'

  // Check if first positional arg is content
  let firstArg = options._ && options._[0]
  // Handle mri assigning content to a flag
  if (typeof options.open === 'string' && isContent(options.open)) {
    firstArg = options.open
  }

  if (firstArg && isContent(firstArg)) {
    const content = interpretEscapes(firstArg)
    const result = parseBlocks(content, {
      syntax,
      open: openKeyword,
      close: closeKeyword,
    })
    console.log(JSON.stringify(result, jsonReplacer, 2))
    return
  }

  // Check for stdin pipe
  const hasNoFileArgs = !options._ || options._.length === 0
  if (!process.stdin.isTTY && hasNoFileArgs) {
    const content = await readStdin()
    if (content.trim()) {
      const result = parseBlocks(content, {
        syntax,
        open: openKeyword,
        close: closeKeyword,
      })
      console.log(JSON.stringify(result, jsonReplacer, 2))
      return
    }
  }

  // No input provided
  console.error('No input provided. Use --help for usage.')
  process.exit(1)
}

run().catch(err => {
  console.error(err.message)
  process.exit(1)
})
