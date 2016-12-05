const fs = require('fs-extra')
const path = require('path')
const merge = require('deepmerge')
const transforms = require('./transforms')
const regexUtils = require('./utils/regex')
const updateContents = require('./updateContents')

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
     * `transforms` - *Object* - (optional) Custom commands to transform block contents, see transforms & custom transforms sections below.
     * @type {Object}
     */
    transforms: transforms,
    /**
     * `outputDir` - *String* - (optional) Change output path of new content. Default behavior is replacing the original file
     * @type {string}
     */
    outputDir: path.dirname(filePath),
    /**
     * `matchWord` - *String* - (optional) Comment pattern to look for & replace inner contents. Default `AUTO-GENERATED-CONTENT`
     * @type {String}
     * @default [AUTO-GENERATED-CONTENT]
     */
    matchWord: 'AUTO-GENERATED-CONTENT',
    /**
     * `DEBUG` - *Boolean* - (optional) set debug flag to `true` to inspect the process
     * @type {string}
     */
    DEBUG: false,
  }

  const userConfig = (config && typeof config === 'object') ? config : {}
  const mergedConfig = merge(defaultConfig, userConfig)
  // Set originalPath constant
  mergedConfig.originalPath = filePath
  // contents of original MD file
  mergedConfig.originalContents = content

  const regex = regexUtils.matchCommentBlock(mergedConfig.matchWord)
  const match = content.match(regex)

  if (mergedConfig.DEBUG) {
    let commentMatches
    while ((commentMatches = regex.exec(content)) !== null) { // eslint-disable-line
      if (commentMatches.index === regex.lastIndex) {
        regex.lastIndex++ // This is necessary to avoid infinite loops
      }
      const command = `Transform ${commentMatches[1]}`
      console.log(command)
    }
  }

  if (match) {
    match.forEach((element) => {
      const newContent = updateContents(element, mergedConfig)
      content = content.replace(element, newContent)
    })
    // then write to file
    const fileName = path.basename(filePath)
    const outputFilePath = path.join(mergedConfig.outputDir, fileName)
    // create folder path if doesnt exist
    fs.ensureFileSync(outputFilePath)
    // update file contents
    fs.writeFileSync(outputFilePath, content)
    console.log(`${outputFilePath} updated`) // eslint-disable-line
    return {
      content: content,
      config: mergedConfig
    }
  }
  // no match return original contents
  console.log(`[No match] <!-- ${mergedConfig.matchWord} --> comment found in ${filePath}`) // eslint-disable-line
  return {
    content: content,
    config: mergedConfig
  }
}
