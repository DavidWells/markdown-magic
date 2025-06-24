const path = require('path')
const fs = require('fs').promises
const isValidFile = require('is-valid-path')
const { blockTransformer } = require('comment-block-transformer')

/**
 * @typedef {import('comment-block-transformer').ProcessContentConfig} ProcessContentConfig
 */

/**
 * @typedef {import('comment-block-transformer').ProcessContentResult} ProcessContentResult
 */

/**
 * Extended configuration for processing files with additional file-specific options
 * @typedef {ProcessContentConfig & {
 *   content?: string
 *   srcPath?: string
 *   outputPath?: string
 *   dryRun?: boolean
 *   patterns?: {
 *     openPattern?: RegExp
 *     closePattern?: RegExp
 *   }
 *   output?: {
 *     directory?: string
 *   }
 *   outputDir?: string
 *   applyTransformsToSource?: boolean
 *   open?: string
 *   close?: string
 * }} ProcessFileOptions
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
 * @returns {Promise<ProcessContentResult>} Result object with processed content and metadata
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
    const isFile = isValidFile(content) && content.indexOf('\n') === -1
    srcPath = (isFile) ? content : undefined
    fileContents = (!isFile) ? content : undefined
  }

  if (!fileContents) {
    fileContents = await readFile(srcPath || content, 'utf8')
  }
  
  let syntaxType = syntax
  if (srcPath && !syntaxType) {
    const ext = path.extname(srcPath).replace(/^\./, '')
    if (ext === 'js') syntaxType = 'js'
    else if (ext === 'md') syntaxType = 'md'
    else syntaxType = ext || 'md'
  }

  const result = await blockTransformer(fileContents, {
    ...opts,
    outputPath,
    srcPath,
    syntax: syntaxType,
  })

  // console.log('resultFromBlockTransformer', result)

  if (dryRun) {
    return result
  }

  if (outputPath && (result.isChanged || result.isNewPath)) {
    let cleanContents = result.updatedContents
    if (result.stripComments && result.patterns.openPattern && result.patterns.closePattern) {
      cleanContents = result.updatedContents.replace(result.patterns.openPattern, '').replace(result.patterns.closePattern, '')
    }
    await writeFile(outputPath, cleanContents)
  }

  if (applyTransformsToSource && srcPath && result.isChanged) {
    await writeFile(srcPath, result.updatedContents)
  }

  return result
}

module.exports = {
  processFile
}