const path = require('path')
const fs = require('fs')
const merge = require('deepmerge')
const commands = require('./commands')
const updateContents = require('./update-contents')
const regex = /\<\!--.*AUTO-GENERATED-CONTENT:START((.|\n|)*?:END.*--\>)/g

module.exports = function markdownSteriods(mdPath, config) {
  let markdown = fs.readFileSync(mdPath, 'utf8', (err, contents) => {
    if (err) {
      throw err
    }
    return contents
  })

  const userConfig = config || {}
  const defaultConfig = {
    commands: commands,
    // replace original MD file by default
    outputPath: mdPath,
    // contents of full MD file
    markdownContents: markdown
  }

  const mergedOptions = merge(defaultConfig, userConfig)

  const match = markdown.match(regex)

  if (match && match.length) {
    match.forEach(function(element) {
       var newContent = updateContents(element, mergedOptions)
       markdown = markdown.replace(element, newContent)
    });
    // then write to file
    fs.writeFileSync(mergedOptions.outputPath, markdown)
  } else {
    console.log(`no AUTO-GENERATED-CONTENT found in markdown file.
path: ${mdPath}
`)
  }
}



