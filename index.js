const fs = require('fs')
const merge = require('deepmerge')
const defaultCommands = require('./lib/transforms')
const updateContents = require('./update-contents')

/**
 * ### Function signature
 * ```js
 * markdownMagic(filename, config, callback)
 * // Configuration and callback are optional params
 * ```
 * @param  {string} filePath - Path to markdown file
 * @param  {object} [config] - configuration object
 * @param  {Function} [callback] - callback function with updated contents
 */
module.exports = function markdownMagic(filePath, config, callback) {
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
     * `transforms` - *object* - (optional) Custom commands to transform block contents, see configuration options below.
     * @type {Object}
     */
    transforms: defaultCommands,
    /**
     * `matchWord` - *string* - (optional) Comment pattern to look for & replace inner contents. Default `AUTO-GENERATED-CONTENT`
     * @type {String}
     * @default [AUTO-GENERATED-CONTENT]
     */
    matchWord: 'AUTO-GENERATED-CONTENT',
    /**
     * `outputPath` - *string* - (optional) Change output path of new content. Default behavior is replacing the original file
     * @type {string}
     */
    outputPath: filePath,
  }

  const userConfig = config || {}
  const mergedConfig = merge(defaultConfig, userConfig)
  // Set originalPath constant
  mergedConfig.originalPath = filePath
  // contents of original MD file
  mergedConfig.originalContents = content

  const word = mergedConfig.matchWord
  const regex = new RegExp(`(?:\\<\\!--(?:.|\\n)*?${word}:START(?:.|\\n)*?\\()(.*)\\)(?:.|\\n)*?<!--(?:.|\\n)*?${word}:END(?:.|\\n)*?--\\>`, 'g')

  let commentMatches
  while ((commentMatches = regex.exec(content)) !== null) { // eslint-disable-line
    // This is necessary to avoid infinite loops with zero-width matches
    if (commentMatches.index === regex.lastIndex) { regex.lastIndex++ }
    // const command = `Command ${commentMatches[1]}`
    // console.log(command)
  }

  const match = content.match(regex)

  if (match) {
    match.forEach((element) => {
      const newContent = updateContents(element, mergedConfig)
      content = content.replace(element, newContent)
    })
    // then write to file
    fs.writeFileSync(mergedConfig.outputPath, content)
    console.log(`${mergedConfig.outputPath} updated`)
    callback && callback(content, mergedConfig)
  } else {
    console.log(`no ${word} comment block found in markdown file`)
    console.log(`path: ${filePath}`)
    callback && callback(content, mergedConfig)
  }
}
