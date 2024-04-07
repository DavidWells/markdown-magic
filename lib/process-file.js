const path = require('path')
const isValidFile = require('is-valid-path')
const { readFile, writeFile } = require('./utils/fs')
const { processContents } = require('./process-contents')

async function processFile(opts = {}) {
  const { content, syntax, outputPath, dryRun, patterns, output = {} } = opts
  const outputDir = output.directory || opts.outputDir

  let applyTransformsToSource = false
  if (typeof output.applyTransformsToSource !== 'undefined') {
    applyTransformsToSource = output.applyTransformsToSource
    // @ts-ignore
  } else if (typeof opts.applyTransformsToSource !== 'undefined') {
    // @ts-ignore
    applyTransformsToSource = opts.applyTransformsToSource
  }

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

  const result = await processContents(fileContents, {
    ...opts,
    outputPath,
    srcPath,
    syntax: syntaxType,
  })
  // console.log('result', result)

  if (dryRun) {
    return result
  }

  if (result.isChanged) {
    let cleanContents = result.updatedContents
    if (result.stripComments && patterns.openPattern && patterns.closePattern) {
      cleanContents = result.updatedContents.replace(patterns.openPattern, '').replace(patterns.closePattern, '')
    }
    if (outputDir) {
      // console.log(`- Update output file: ${outputPath}`)
      await writeFile(outputPath, cleanContents)
    }
    if (!outputDir || applyTransformsToSource) {
      // console.log(`- Update source file: ${srcPath}`)
      await writeFile(srcPath, result.updatedContents)
    }
  }

  return result
}

module.exports = {
  processFile
}