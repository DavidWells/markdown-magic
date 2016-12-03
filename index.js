const fs = require('fs')
const merge = require('deepmerge')
const transforms = require('./lib/transforms')
const regexUtils = require('./lib/utils/regex')
const updateContents = require('./update-contents')

/**
 * ### API
 * ```js
 * markdownMagic(filePath, config, callback)
 * ```
 * - `filePath` Path to markdown file
 * - `config` See configuration options below
 * - `callback` callback to run after markdown updates
 *
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
     * `transforms` - *Object* - (optional) Custom commands to transform block contents, see configuration options below.
     * @type {Object}
     */
    transforms: transforms,
    /**
     * `outputPath` - *String* - (optional) Change output path of new content. Default behavior is replacing the original file
     * @type {string}
     */
    outputPath: filePath,
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

  const cb = (!callback && typeof config === 'function') ? config : callback
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
    fs.writeFileSync(mergedConfig.outputPath, content)
    console.log(`${mergedConfig.outputPath} updated`) // eslint-disable-line
    cb && cb(content, mergedConfig)
  } else {
    console.log(`no <!-- ${mergedConfig.matchWord} --> comment block found in markdown file`) // eslint-disable-line
    console.log(`path: ${filePath}`) // eslint-disable-line
    cb && cb(content, mergedConfig)
  }
}
