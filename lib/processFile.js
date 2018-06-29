"use strict" // eslint-disable-line
const fs = require('fs-extra')
const path = require('path')
const merge = require('deepmerge')
const transforms = require('./transforms')
const regexUtils = require('./utils/regex')
const pluginSortOrder = require('./utils/sortOrder')
const updateContents = require('./updateContents')
const cwd = process.cwd()

module.exports = function processFile(filePath, config) {
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.log(`FILE NOT FOUND ${filePath}`)
    throw e
  }
  /**
   * ### Configuration Options
   */
  const defaultConfig = {
    /**
     * - `transforms` - *object* - (optional) Custom commands to transform block contents, see transforms & custom transforms sections below.
     * @type {Object}
     */
    transforms: transforms,
    /**
     * - `outputDir` - *string* - (optional) Change output path of new content. Default behavior is replacing the original file
     * @type {string}
     */
    outputDir: path.dirname(filePath),
    /**
     * - `matchWord` - *string* - (optional) Comment pattern to look for & replace inner contents. Default `AUTO-GENERATED-CONTENT`
     * @type {string}
     * @default [AUTO-GENERATED-CONTENT]
     */
    matchWord: 'AUTO-GENERATED-CONTENT',
    /**
     * - `DEBUG` - *Boolean* - (optional) set debug flag to `true` to inspect the process
     * @type {string}
     */
    DEBUG: false,
  }

  const userConfig = (config && typeof config === 'object') ? config : {}
  const mergedConfig = merge(defaultConfig, userConfig)

  const registeredTransforms = Object.keys(mergedConfig.transforms)
  // Set originalPath constant
  mergedConfig.originalPath = filePath
  // contents of original MD file
  mergedConfig.originalContent = content
  // set default outputContents for first pass for single commands
  mergedConfig.outputContent = content

  const regex = regexUtils.matchCommentBlock(mergedConfig.matchWord)
  const match = content.match(regex)
  const transformsFound = []

  if (match) {
    let commentMatches
    let matchIndex = 0
    while ((commentMatches = regex.exec(content)) !== null) { // eslint-disable-line
      if (commentMatches.index === regex.lastIndex) {
        regex.lastIndex++ // This is necessary to avoid infinite loops
      }
      const command = `Transform ${commentMatches[1]}` // eslint-disable-line
      // console.log(command)
      transformsFound.push({
        spaces: commentMatches[1], // Preserve indentation
        transform: commentMatches[2],
        match: match[matchIndex]
      })
      // wait
      matchIndex++
    }

    const transformsToRun = pluginSortOrder(registeredTransforms, transformsFound)
    if (mergedConfig.DEBUG) {
      console.log('↓ transformsToRun') // eslint-disable-line
      console.log(transformsToRun) // eslint-disable-line
    }

    // run sort
    let transformMsg = ''
    transformsToRun.forEach((element) => {
      transformMsg += `  ⁕ ${element.transform} \n`
      // console.log('order', element.transform)
      const newContent = updateContents(element.match, mergedConfig)

      const firstLineIndentation = element.spaces
      const contentWithIndentation = newContent.split('\n').join(`\n` + element.spaces)
      const preserveTabs = `${firstLineIndentation}${contentWithIndentation}`

      content = content.replace(element.match, preserveTabs)
      mergedConfig.outputContent = content
    })

    // then write to file
    const fileName = path.basename(filePath)
    const outputFilePath = path.join(mergedConfig.outputDir, fileName)

    // create folder path if doesnt exist
    fs.ensureFileSync(outputFilePath)
    // update file contents
    fs.writeFileSync(outputFilePath, content)

    const msg = outputFilePath.replace(cwd, '')

    console.log(`✔ ${msg} Updated`) // eslint-disable-line
    console.log(` Transforms run`)
    console.log(transformMsg) // eslint-disable-line

    // set return values
    mergedConfig.outputFilePath = outputFilePath
    mergedConfig.outputContent = content

    return mergedConfig
  }

  if (mergedConfig.DEBUG) {
    console.log(`↓ ${filePath}`) // eslint-disable-line
    console.log(`[No match] <!-- ${mergedConfig.matchWord} --> comment found`) // eslint-disable-line
  }

  // no match return original contents
  return mergedConfig
}
