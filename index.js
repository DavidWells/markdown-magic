const path = require('path')
const fs = require('fs')
const merge = require('deepmerge')
const commands = require('./commands')
const updateContents = require('./update-contents')

module.exports = function markdownSteriods(mdPath, config) {
  let markdown = fs.readFileSync(mdPath, 'utf8', (err, contents) => {
    if (err) {
      throw err
    }
    return contents
  })

  const userConfig = config || {}
  const defaultConfig = {
    // Comment pattern to look for and replace inner contents
    matchWord: 'AUTO-GENERATED-CONTENT',
    // transform functions
    commands: commands,
    // replace original MD file by default
    outputPath: mdPath,
    // contents of full MD file
    markdownContents: markdown
  }

  const mergedOptions = merge(defaultConfig, userConfig)
  const CONSTANTS = {
    // original path of md, needed for relative path lookups
    originalPath: mdPath,
  }
  const finalConfig = merge(mergedOptions, CONSTANTS)

  const word = finalConfig.matchWord
  // pattern /\<\!--.*AUTO-GENERATED-CONTENT:START((.|\n|)*?:END.*--\>)/g
  const regex = new RegExp('\\<\\!--.*'+word+':START((.|\\n|)*?'+word+':END.*--\\>)', 'g')
  const match = markdown.match(regex)

  if (match && match.length) {
    match.forEach(function(element) {
       var newContent = updateContents(element, finalConfig)
       markdown = markdown.replace(element, newContent)
    });
    // then write to file
    fs.writeFileSync(finalConfig.outputPath, markdown)
    console.log(`${mdPath} updated`)
  } else {
    console.log(`no ${word} comment block found in markdown file.
path: ${mdPath}
`)
  }
}



