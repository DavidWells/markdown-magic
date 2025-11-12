const { parseBlocks } = require('comment-block-parser')

const SYNTAX = 'md'
const OPEN_WORD = 'block'
const CLOSE_WORD = '/block'

/**
 * Types from comment-block-parser
 * @typedef {import('comment-block-parser').BlockData} BlockData
 * @typedef {import('comment-block-parser').ParseBlocksResult} ParseBlocksResult
 * @typedef {import('comment-block-parser').BlockDetails} BlockDetails
 */

/**
 * Key value pair of transform name to transform function
 * @typedef {Record<string, TransformFunction>} TransformerPlugins
 */

/**
 * Transform function signature
 * @typedef {(api: TransformApi) => Promise<string>|string} TransformFunction
 */

/**
 * Transform function API. 
 * This is the object passed to the transform function.
 * @typedef {Object} TransformApi
 * @property {string} transform - Name of the transform
 * @property {string} content - Content to transform
 * @property {Object} options - Transform options
 * @property {string} [srcPath] - Source file path
 * @property {string} [outputPath] - Output file path
 * @property {{regex: Object, [key: string]: any}} settings - Additional settings including regex patterns
 * @property {string} currentContent - Current file contents
 * @property {string} originalContent - Original file contents
 * @property {() => string} getCurrentContent - Function to get current file contents
 * @property {() => string} getOriginalContent - Function to get original file contents
 * @property {() => BlockContext} getOriginalBlock - Function to get the original block data
 * @property {(content?: string) => Object} getBlockDetails - Function to get detailed block information
 */

/**
 * Extended block context with additional metadata
 * @typedef {BlockData & {
 *   srcPath?: string,
 *   regex: {blocks: RegExp, open: RegExp, close: RegExp},
 *   originalContents: string,
 *   currentContents: string
 * }} BlockContext
 */

/**
 * Middleware function signature
 * @typedef {Object} Middleware
 * @property {string} name - Name of the middleware
 * @property {function(BlockData, string): Promise<string>|string} transform - Transform function that takes block data and current text and returns transformed content
 */

/**
 * Configuration object for processing contents.
 * @typedef {Object} ProcessContentConfig
 * @property {string} [open=OPEN_WORD] - The opening delimiter.
 * @property {string} [close=CLOSE_WORD] - The closing delimiter.
 * @property {string} [syntax='md'] - The syntax type.
 * @property {TransformerPlugins} [transforms={}] - Plugins for transforms.
 * @property {Array<Middleware>}  [beforeMiddleware=[]] - Middleware functions change inner block content before transforms.
 * @property {Array<Middleware>}  [afterMiddleware=[]] - Middleware functions change inner block content after transforms.
 * @property {boolean} [removeComments=false] - Remove comments from the processed contents.
 * @property {string} [srcPath] - The source path.
 * @property {string} [outputPath] - The output path.
 * @property {import('comment-block-parser').CustomPatterns} [customPatterns] - Custom regex patterns for open and close tags.
 */

/**
 * @typedef {Object} BlockTransformerResult
 * @property {boolean} isChanged - Whether the content was changed by transforms
 * @property {boolean} isNewPath - Whether srcPath differs from outputPath
 * @property {boolean} stripComments - Whether to strip comments from output
 * @property {string} [srcPath] - Source file path
 * @property {string} [outputPath] - Output file path
 * @property {Array<BlockData>} transforms - Array of transforms that were applied
 * @property {Array<any>} missingTransforms - Array of transforms that were not found
 * @property {string} originalContents - Original input text
 * @property {string} updatedContents - Transformed output text
 * @property {Object} [patterns] - Regex patterns used for parsing
 */

/**
 * Transform markdown blocks based on configured transforms
 * @param {string} inputText - The text content to process
 * @param {ProcessContentConfig} config - Configuration options
 * @returns {Promise<BlockTransformerResult>} Result object containing transformed content and metadata
 */
async function blockTransformer(inputText, config) {
  const opts = config || {}

  const {
    srcPath,
    outputPath,
    open = OPEN_WORD,
    close = CLOSE_WORD,
    syntax = SYNTAX,
    transforms = {},
    beforeMiddleware = [],
    afterMiddleware = [],
    removeComments = false,
    customPatterns
  } = opts

  let foundBlocks = {}
  try {
    foundBlocks = parseBlocks(inputText, {
      syntax,
      open,
      close,
      customPatterns
    })
  } catch (e) {
    const errMsg = (srcPath) ? `in ${srcPath}` : inputText
    throw new Error(`${e.message}\nFix content in ${errMsg}\n`)
  }


  const { openPattern, closePattern } = foundBlocks


  const blocksWithTransforms = foundBlocks.blocks
    .filter((block) => block.type)
    .map((block, i) => {
      const transform = block.type
      delete block.type
      return Object.assign({ transform }, block)
    })

  // console.log('blocksWithTransforms', blocksWithTransforms)

  const regexInfo = {
    blocks: foundBlocks.pattern,
    open: openPattern,
    close: closePattern,
  }

  const transformsToRun = sortTransforms(blocksWithTransforms, transforms)

  let missingTransforms = []
  // Track cumulative offset changes as we modify the text
  let cumulativeOffset = 0
  
  let updatedContents = await transformsToRun.reduce(async (contentPromise, originalMatch) => {
    const updatedText = await contentPromise
    /* Apply leading middleware */
    const match = await applyMiddleware(originalMatch, updatedText, beforeMiddleware)
    const { block, content, open, close, transform, options, context, index } = match
    const closeTag = close.value
    const openTag = open.value
    
    let tempContent = content.value
    const currentTransformFn = getTransform(transform, transforms)

    if (currentTransformFn) {
      const blockContext = {
        srcPath: config.srcPath,
        ...match,
        regex: regexInfo,
        originalContents: inputText,
        currentContents: updatedText,
      }
      const { transforms, srcPath, outputPath, ...restOfSettings } = opts

      const returnedContent = await currentTransformFn({
        transform, // transform name
        content: content.value,
        options: options || {},
        srcPath,
        outputPath,
        settings: {
          ...restOfSettings,
          regex: blockContext.regex,
        },
        currentContent: updatedText,
        originalContent: inputText,
        getCurrentContent: () => updatedText,
        getOriginalContent: () => inputText,
        getOriginalBlock: () => blockContext,
        getBlockDetails: (content) => {
          return getDetails({
            contents: content || updatedText,
            openValue: open.value,
            srcPath,
            index,
            opts: config
          })
        },
      })

      if (returnedContent) {
        tempContent = returnedContent
      }
    }
    /* Apply trailing middleware */
    const afterContent = await applyMiddleware({
      ...match,
      ...{
        content: {
          ...match.content,
          value: tempContent
        }
      }
    }, updatedText, afterMiddleware)

    if (!currentTransformFn) {
      missingTransforms.push(afterContent)
    }

    let newContent = afterContent.content.value

    // console.log("afterContent.content.rawValue", afterContent.content.rawValue)
    /* handle different cases of typeof newContent. @TODO: make this an option */
    if (typeof newContent === 'number') {
      newContent = String(newContent)
    } else if (Array.isArray(newContent)) {
      newContent = JSON.stringify(newContent, null, 2)
    } else if (typeof newContent === 'object') {
      newContent = JSON.stringify(newContent, null, 2)
    }

    // console.log('options', options)
    // console.log('newContent', `"${newContent}"`)

    const formattedNewContent = (options.noTrim) ? newContent : newContent
    // const formattedNewContent = newContent//.trim()
    // console.log('formattedNewContent', `"${formattedNewContent}"`)
    const fix = removeConflictingComments(formattedNewContent, openPattern, closePattern)

    // console.log('fix', `"${fix}"`)

    let preserveIndent = 0
    // console.log('match.content.indent', match.content.indent)
    if (match.content.indent) {
      preserveIndent = match.content.indent
      // console.log('preserveIndent', preserveIndent)
    } else if (preserveIndent === 0) {
      preserveIndent = block.indent
    }

    // Don't apply indentation for single-line content when original was also single-line
    if (!context.isMultiline && !block.match.includes('\n')) {
      preserveIndent = 0
    }

    let addTrailingNewline = ''
    if (context.isMultiline && !fix.endsWith('\n') && fix !== '' && closeTag.indexOf('\n') === -1) {
      addTrailingNewline = '\n'
    }

    let addLeadingNewline = ''
    if (context.isMultiline && !fix.startsWith('\n') && fix !== '' && openTag.indexOf('\n') === -1) {
      addLeadingNewline = '\n'
    }

    let fixWrapper = ''
    if (!context.isMultiline && fix.indexOf('\n') > -1) {
      fixWrapper = '\n'
    }
  
    // console.log('updatedText', block.value)
    
    const indent = addLeadingNewline + indentString(fix, preserveIndent) + addTrailingNewline
    const newCont = `${openTag}${fixWrapper}${indent}${fixWrapper}${closeTag}`
    
    // Use position-based replacement to handle duplicate block content
    const adjustedStart = block.start + cumulativeOffset
    const adjustedEnd = block.end + cumulativeOffset
    const before = updatedText.substring(0, adjustedStart)
    const after = updatedText.substring(adjustedEnd)
    const newContents = before + newCont + after
    
    // Update offset for next iteration
    cumulativeOffset += (newCont.length - block.value.length)
    
    return Promise.resolve(newContents)
  }, Promise.resolve(inputText))

  const isNewPath = srcPath !== outputPath

  if (removeComments && !isNewPath) {
    throw new Error('"removeComments" can only be used if "outputPath" option is set. Otherwise this will break doc generation.')
  }

  const stripComments = isNewPath && removeComments


  // console.log('inputText', inputText)
  // console.log('updatedContents', updatedContents) 
  return {
    isChanged: inputText !== updatedContents,
    isNewPath,
    stripComments,
    srcPath,
    outputPath,
    transforms: transformsToRun,
    missingTransforms,
    originalContents: inputText,
    updatedContents,
    patterns: regexInfo,
  }
}

/** @typedef {BlockData & { sourceLocation?: string, transform?: string }} BlockDataExtended */

function getDetails({
  contents,
  openValue,
  srcPath,
  index,
  opts
}) {
  const blockData = parseBlocks(contents, opts)
  const matchingBlocks = blockData.blocks.filter((block) => {
    return block.open.value === openValue
  })

  if (!matchingBlocks.length) {
    return {}
  }

  /** @type {BlockDataExtended} */
  let foundBlock = matchingBlocks[0]
  if (matchingBlocks.length > 1 && index) {
    foundBlock = matchingBlocks.filter((block) => {
      return block.index === index
    })[0]
  }

  if (srcPath) {
    const location = getCodeLocation(srcPath, foundBlock.lines[0])
    foundBlock.sourceLocation = location
  }
  return foundBlock
}

function removeConflictingComments(content, openPattern, closePattern) {
  const removeOpen = content.replace(openPattern, '')
  closePattern.lastIndex = 0
  const hasClose = closePattern.exec(content)
  if (!hasClose) {
    return removeOpen
  }
  const closeTag = `${hasClose[2]}${hasClose[3] || ''}`
  return removeOpen
    .replace(closePattern, '')
    .replace(/\n$/, '')
}

/**
 * Apply middleware functions to block data
 * @param {BlockData} data - The block data to transform
 * @param {string} updatedText - The current updated text content
 * @param {Array<Middleware>} middlewares - Array of middleware functions to apply
 * @returns {Promise<BlockDataExtended>} The transformed block data
 */
function applyMiddleware(data, updatedText, middlewares) {
  return middlewares.reduce(async (acc, curr) => {
    const blockData = await acc
    const updatedContent = await curr.transform(blockData, updatedText)
    return Promise.resolve({
      ...blockData,
      ...{
        content: {
          ...blockData.content,
          value: updatedContent
        }
      }
    })
  }, Promise.resolve(data))
}

function getTransform(name, transforms = {}) {
  return transforms[name] || transforms[name.toLowerCase()]
}

function sortTransforms(foundTransForms, registeredTransforms) {
  if (!foundTransForms) return []
  return foundTransForms.sort((a, b) => {
    if (a.transform === 'TOC' || a.transform === 'sectionToc') return 1
    if (b.transform === 'TOC' || b.transform === 'sectionToc') return -1
    return 0
  }).map((item) => {
    if (getTransform(item.transform, registeredTransforms)) {
      return item
    }
    return {
      ...item,
      context: {
        ...item.context,
        isMissing: true,
      }
    }
  })
}

/**
 * Indent a string by a specified number of spaces
 * @param {string} str - The string to indent
 * @param {number} count - Number of spaces to indent by
 * @returns {string} The indented string
 */
function indentString(str, count) {
  if (!str) return str
  return str.split('\n').map(line => ' '.repeat(count) + line).join('\n')
}

/**
 * Trim whitespace from a string
 * @param {string} str - The string to trim
 * @returns {string} The trimmed string
 */
function trimString(str) {
  if (!str) return str
  return str.trim()
}

/**
 * Trim leading and trailing lines from a string
 * @param {string} str - The string to trim
 * @returns {string} The string with leading and trailing lines removed
 */
function trimLeadingAndTrailing(str) {
  if (!str) return str
  return str.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '')
}

function getCodeLocation(srcPath, line, column = '0') {
  return `${srcPath}:${line}:${column}`
}

if (require.main === module) {
  const yaml = `
  - name: Run tests two
    run: npm test two
  `

  // console.log(indentString(yaml, 4))
}

module.exports = {
  blockTransformer,
  indentString,
} 