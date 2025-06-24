const path = require('path')
const isValidFile = require('is-valid-path')
const { readFile, writeFile } = require('./utils/fs')
const { blockTransformer } = require('comment-block-transformer')

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
  // console.log('processFile order', srcPath)

  const result = await blockTransformer(fileContents, {
    ...opts,
    outputPath,
    srcPath,
    syntax: syntaxType,
  })
  /*
  console.log('result', result)
  /** */

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
      // console.log(`- Update output file: ${outputPath}`)
      await writeFile(outputPath, cleanContents)
    }
    if (applyTransformsToSource) {
      // console.log(`- Update source file: ${srcPath}`)
      await writeFile(srcPath, result.updatedContents)
    }
  }

  return result
}

module.exports = {
  processFile
}