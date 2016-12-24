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
  mergedConfig.originalContent = content

  const regex = regexUtils.matchCommentBlock(mergedConfig.matchWord)
  const match = content.match(regex)
  const transformsToRun = []

  if (match) {
    let commentMatches
    let matchIndex = 0
    while ((commentMatches = regex.exec(content)) !== null) { // eslint-disable-line
      if (commentMatches.index === regex.lastIndex) {
        regex.lastIndex++ // This is necessary to avoid infinite loops
      }
      const command = `Transform ${commentMatches[1]}`
      console.log(command)
      transformsToRun.push({
        transform: commentMatches[1],
        match: match[matchIndex]
      })
      // wait
      matchIndex++
    }

    /*
      if the function returns less than zero, sort a before b
      if the function returns greater than zero, sort b before a
      if the function returns zero, leave a and b unchanged with respect to each other
    */
    // run sort
    transformsToRun.sort((a, b) => {
      if (a.transform !== "TOC") {
        return -1;
      }
      if (b.transform !== "TOC") {
        return 1;
      }
      return 0;
    }).forEach((element) => {
      console.log('order', element.transform)
      const newContent = updateContents(element.match, mergedConfig)
      content = content.replace(element.match, newContent)
      mergedConfig.outputContent = content
    });

    // console.log('match', match)
    // match.forEach((element) => {
    //   //console.log('element', element)
    //   const newContent = updateContents(element, mergedConfig)
    //   content = content.replace(element, newContent)
    // })
    // then write to file
    const fileName = path.basename(filePath)
    const outputFilePath = path.join(mergedConfig.outputDir, fileName)

    // create folder path if doesnt exist
    fs.ensureFileSync(outputFilePath)
    // update file contents
    fs.writeFileSync(outputFilePath, content)
    console.log(`${outputFilePath} updated`) // eslint-disable-line

    // set return values
    mergedConfig.outputFilePath = outputFilePath
    mergedConfig.outputContent = content

    return mergedConfig
  }
  // no match return original contents
  console.log(`[No match] <!-- ${mergedConfig.matchWord} --> comment found in ${filePath}`) // eslint-disable-line
  return mergedConfig
}
