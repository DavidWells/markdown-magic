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

/**
 * Check if string is a single word (potential match word)
 * @param {string} str
 * @returns {boolean}
 */
function isSingleWord(str) {
  if (!str) return false
  if (/\s/.test(str)) return false
  return !isContent(str)
}

async function run() {
  if (options.help || options.h) {
    console.log(`
Usage: block-parser [options] [content]
       block-parser <match-word> [content]

Options:
  --open             Opening comment keyword (default: block)
  --close            Closing comment keyword (default: /block)
  --syntax           Comment syntax: md, js, html, etc (default: md)
  --help, -h         Show this help message
  --version, -v      Show version

Examples:
  block-parser "<!-- block enabled -->\\ncontent\\n<!-- /block -->"
  block-parser auto "<!-- auto isCool -->\\ncontent\\n<!-- /auto -->"
  echo "<!-- block enabled --><!-- /block -->" | block-parser
  echo "<!-- auto foo --><!-- /auto -->" | block-parser auto
`)
    return
  }

  if (options.version || options.v) {
    const pkg = require('./package.json')
    console.log(`${pkg.name} v${pkg.version}`)
    return
  }
  
  const syntax = options.syntax || 'md'
  const positionalArgs = options._ || []
  const firstArg = positionalArgs[0]
  const secondArg = positionalArgs[1]

  // Determine match word and content from args
  let matchWord = options.open || options.match || options.find
  let contentArg = null

  // If first positional arg is single word, treat as match word
  if (firstArg && isSingleWord(firstArg)) {
    matchWord = firstArg
    contentArg = secondArg
  } else if (firstArg && isContent(firstArg)) {
    contentArg = firstArg
  }
  // Handle mri assigning content to a flag
  if (!contentArg && typeof options.open === 'string' && isContent(options.open)) {
    contentArg = options.open
  }

  const openKeyword = matchWord || 'block'
  const closeKeyword = options.close || (matchWord ? `/${matchWord}` : '/block')

  // Process content from arg
  if (contentArg) {
    const content = interpretEscapes(contentArg)
    const result = parseBlocks(content, {
      syntax,
      open: openKeyword,
      close: closeKeyword,
    })
    console.log(JSON.stringify(result, jsonReplacer, 2))
    return
  }

  // Check for stdin pipe
  if (!process.stdin.isTTY) {
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
