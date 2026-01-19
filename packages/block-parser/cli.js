#!/usr/bin/env node
// CLI for parsing comment blocks from markdown and other files
const fs = require('fs')
const path = require('path')
const mri = require('mri')
const { parseBlocks } = require('./src/index')

const argv = process.argv.slice(2)
const options = mri(argv, {
  boolean: ['parseType', 'help', 'h', 'version', 'v'],
  string: ['open', 'syntax'],
  alias: {
    parseType: ['parsetype', 'parse-type'],
  },
})


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
 * Regex literal pattern like /pattern/flags
 */
const REGEX_LITERAL = /^\/((?:\\\/|[^\/])+)\/([gimsuy]*)$/

/**
 * Check if string is a regex literal like /pattern/flags
 * @param {string} str
 * @returns {boolean}
 */
function isRegexLiteral(str) {
  if (!str || typeof str !== 'string') return false
  return REGEX_LITERAL.test(str)
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
 * Check if string looks like a file path
 * @param {string} str
 * @returns {boolean}
 */
function looksLikeFilePath(str) {
  if (!str) return false
  if (isContent(str)) return false
  if (isRegexLiteral(str)) return false
  // Has file extension or starts with ./ or / or contains path separators
  return /\.\w+$/.test(str) || str.startsWith('./') || str.startsWith('/') || str.includes(path.sep)
}

/**
 * Try to read file, returns content or null if not a file
 * @param {string} str
 * @returns {string|null}
 */
function tryReadFile(str) {
  if (!looksLikeFilePath(str)) return null
  try {
    const resolved = path.resolve(str)
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      return fs.readFileSync(resolved, 'utf8')
    }
  } catch (e) {
    // Not a readable file
  }
  return null
}

/**
 * Check if string is a single word (potential match word)
 * @param {string} str
 * @returns {boolean}
 */
function isSingleWord(str) {
  if (!str) return false
  if (/\s/.test(str)) return false
  if (looksLikeFilePath(str)) return false
  return !isContent(str)
}

/**
 * Map file extensions to syntax types
 */
const extToSyntax = {
  '.md': 'md',
  '.markdown': 'md',
  '.html': 'html',
  '.htm': 'html',
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.ts': 'js',
  '.mts': 'js',
  '.cts': 'js',
  '.json': 'js',
  '.jsx': 'jsx',
  '.tsx': 'jsx',
  '.mdx': 'jsx',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sql': 'sql',
  '.toml': 'toml',
}

/**
 * Detect syntax from file path extension
 * @param {string} filePath
 * @returns {string|null}
 */
function detectSyntax(filePath) {
  if (!filePath) return null
  const ext = path.extname(filePath).toLowerCase()
  return extToSyntax[ext] || null
}

async function run() {
  if (options.help || options.h) {
    console.log(`
Usage: comment-block-parser [options] [content]
       comment-block-parser <match-word> [content]

Options:
  --open             Opening pattern (literal word or regex pattern)
  --close            Closing pattern (if omitted with regex open, uses /name backreference)
  --no-close         Match single comments only (no close tag required)
  --syntax           Comment syntax: md, js, jsx, yaml, sql, toml (auto-detected from file extension)
  --parseType        Treat first arg after open keyword as transform type (default: false)
  --help, -h         Show this help message
  --version, -v      Show version

Examples:
  comment-block-parser ./file.md                    # default: open=block, close=/block
  comment-block-parser ./src/index.js               # auto-detects js syntax
  comment-block-parser auto ./file.md               # open=auto, close=/auto
  echo "<!-- block enabled --><!-- /block -->" | comment-block-parser

Single comment mode (--no-close):
  comment-block-parser --no-close --open config ./file.md
  # Matches: <!-- config debug=true --> (no close tag needed)

  comment-block-parser --no-close widget ./file.md
  # Matches all <!-- widget ... --> comments

Pattern mode (--open without --close):
  comment-block-parser --open MyComp --syntax js ./file.js
  # Matches: /* MyComp opts */ content /* /MyComp */

  comment-block-parser --open "CompA|CompB" --syntax js ./file.js
  # Matches both /* CompA */ ... /* /CompA */ and /* CompB */ ... /* /CompB */
`)
    return
  }

  if (options.version || options.v) {
    const pkg = require('./package.json')
    console.log(`${pkg.name} v${pkg.version}`)
    return
  }
  
  const positionalArgs = options._ || []
  const firstArg = positionalArgs[0]
  const secondArg = positionalArgs[1]

  // Determine match word and content from args
  let matchWord = null  // Only from positional arg, not --open flag
  let regexLiteralArg = null  // Regex literal like /pattern/ triggers pattern mode
  let contentArg = null
  let contentSource = null
  let filePath = null

  // If first positional arg is regex literal, use pattern mode
  // If first positional arg is single word, treat as match word (literal mode)
  if (firstArg && isRegexLiteral(firstArg)) {
    regexLiteralArg = firstArg
    contentArg = secondArg
  } else if (firstArg && isSingleWord(firstArg)) {
    matchWord = firstArg
    contentArg = secondArg
  } else if (firstArg) {
    contentArg = firstArg
  }
  // Handle mri assigning content to a flag
  if (!contentArg && typeof options.open === 'string' && isContent(options.open)) {
    contentArg = options.open
  }

  const openKeyword = regexLiteralArg || matchWord || options.open || 'block'
  // mri parses --no-close as close: false, also support --close false (string)
  const noClose = options.close === false || options.close === 'false'
  // Positional match word uses literal mode with derived close
  // Regex literal or --open without --close triggers pattern mode
  // --no-close triggers single comment mode
  const closeKeyword = noClose
    ? false  // single comment mode
    : matchWord
      ? (options.close || `/${matchWord}`)  // positional match word: literal mode
      : options.close  // regex literal or --open flag: undefined triggers pattern mode

  // Try to read content from file if it looks like a path
  if (contentArg) {
    const fileContent = tryReadFile(contentArg)
    if (fileContent !== null) {
      contentSource = fileContent
      filePath = contentArg
    } else if (isContent(contentArg)) {
      contentSource = interpretEscapes(contentArg)
    }
  }

  // Auto-detect syntax from file extension, fallback to --syntax or 'md'
  const syntax = options.syntax || detectSyntax(filePath || '') || 'md'
  const firstArgIsType = Boolean(options.parseType)

  // Build parser options - if close is undefined, parseBlocks auto-detects pattern mode
  // If close is false, single comment mode is triggered
  const parserOpts = { syntax, open: openKeyword, firstArgIsType }
  if (closeKeyword !== undefined) {
    parserOpts.close = closeKeyword
  }

  // Process content from arg or file
  if (contentSource) {
    const result = parseBlocks(contentSource, parserOpts)
    console.log(JSON.stringify(result, jsonReplacer, 2))
    return
  }

  // Check for stdin pipe
  if (!process.stdin.isTTY) {
    let content = await readStdin()
    content = content.trim()
    if (content) {
      // Check if piped content is a file path
      let stdinFilePath = null
      const fileContent = tryReadFile(content)
      if (fileContent !== null) {
        stdinFilePath = content
        content = fileContent
      }
      // Auto-detect syntax from piped file path if not already set
      const stdinSyntax = options.syntax || detectSyntax(stdinFilePath || '') || 'md'
      const stdinParserOpts = { syntax: stdinSyntax, open: openKeyword, firstArgIsType }
      if (closeKeyword !== undefined) {
        stdinParserOpts.close = closeKeyword
      }
      const result = parseBlocks(content, stdinParserOpts)
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
