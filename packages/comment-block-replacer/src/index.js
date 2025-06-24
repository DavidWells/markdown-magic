const path = require('path')
const fs = require('fs').promises
const isValidFile = require('is-valid-path')
const { blockTransformer } = require('comment-block-transformer')

/**
 * Options for processing files with comment block replacements
 * @typedef {Object} ProcessFileOptions
 * @property {string} [content] - File content as string (mutually exclusive with srcPath)
 * @property {string} [srcPath] - Source file path (mutually exclusive with content)  
 * @property {string} [syntax] - File syntax type (e.g., 'md', 'js', 'html')
 * @property {string} [outputPath] - Output file path for processed content
 * @property {boolean} [dryRun=false] - If true, process but don't write files
 * @property {Object} [patterns] - Comment patterns with openPattern and closePattern
 * @property {string} [patterns.openPattern] - Opening comment pattern regex
 * @property {string} [patterns.closePattern] - Closing comment pattern regex
 * @property {Object} [output={}] - Output configuration
 * @property {string} [output.directory] - Output directory path
 * @property {string} [outputDir] - Legacy output directory option
 * @property {boolean} [applyTransformsToSource=false] - Whether to apply transforms to source file
 * @property {Object} [transforms={}] - Transform functions to apply to blocks
 * @property {Array} [beforeMiddleware=[]] - Middleware to run before transforms
 * @property {Array} [afterMiddleware=[]] - Middleware to run after transforms
 * @property {boolean} [removeComments=false] - Whether to remove comment blocks from output
 * @property {string} [open] - Opening delimiter for comment blocks
 * @property {string} [close] - Closing delimiter for comment blocks
 */

/**
 * Result of processing a file with comment block replacements
 * @typedef {Object} ProcessFileResult
 * @property {boolean} isChanged - Whether the content was modified
 * @property {boolean} isNewPath - Whether srcPath differs from outputPath
 * @property {boolean} stripComments - Whether comments should be stripped from output
 * @property {string} [srcPath] - Source file path used
 * @property {string} [outputPath] - Output file path used
 * @property {Array} transforms - Array of transforms that were applied
 * @property {Array} missingTransforms - Array of transforms that were not found
 * @property {string} originalContents - Original input content
 * @property {string} updatedContents - Processed output content
 */

/**
 * Write file with directory creation if needed
 * @param {string} filePath - File path to write to
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content)
  } catch(e) {
    const dirName = path.dirname(filePath)
    await fs.mkdir(dirName, { recursive: true })
    await fs.writeFile(filePath, content)
  }
}

/**
 * Read file content
 * @param {string} filePath - File path to read from
 * @param {string} [encoding='utf8'] - File encoding
 * @returns {Promise<string>} File content
 */
async function readFile(filePath, encoding = 'utf8') {
  return fs.readFile(filePath, encoding)
}

/**
 * Process a file with comment block replacements using configured transforms
 * @param {ProcessFileOptions} [opts={}] - Processing options
 * @returns {Promise<ProcessFileResult>} Result object with processed content and metadata
 */
async function processFile(opts = {}) {
  const { content, syntax, outputPath, dryRun, patterns, output = {}, applyTransformsToSource } = opts
  const outputDir = output.directory || opts.outputDir

  let srcPath = opts.srcPath
  if (srcPath && content) {
    throw new Error(`Can't set both "srcPath" & "content"`) 
  }
  let fileContents
  if (content) {
    const isFile = isValidFile(content)
    srcPath = (isFile) ? content : undefined
    fileContents = (!isFile) ? content : undefined
  }

  if (!fileContents) {
    fileContents = await readFile(srcPath || content, 'utf8')
  }
  
  let syntaxType = syntax
  if (srcPath && !syntaxType) {
    syntaxType = path.extname(srcPath).replace(/^\./, '')
  }

  const result = await blockTransformer(fileContents, {
    ...opts,
    outputPath,
    srcPath,
    syntax: syntaxType,
  })

  if (dryRun) {
    return result
  }

  /* If it's changed or its a new file to write */
  if (result.isChanged || result.isNewPath) {
    let cleanContents = result.updatedContents
    if (result.stripComments && patterns.openPattern && patterns.closePattern) {
      cleanContents = result.updatedContents.replace(patterns.openPattern, '').replace(patterns.closePattern, '')
    }
    if (outputDir || (srcPath !== outputPath)) {
      await writeFile(outputPath, cleanContents)
    }
    if (applyTransformsToSource) {
      await writeFile(srcPath, result.updatedContents)
    }
  }

  return result
}

module.exports = {
  processFile
}