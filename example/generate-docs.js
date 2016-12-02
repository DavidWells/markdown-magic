const fs = require('fs')
const path = require('path')
const dox = require('dox')
const exec = require('child_process').exec
// require('markdown-steriods') lib
const markdownSteriods = require('../index')

const config = {
  commands: {
    /* Update the content in comment in .md matching
       AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE)
    */
    customTransform: function(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Update the content in comment in .md matching
      AUTO-GENERATED-CONTENT (RENDERDOCS:path=../file.js)
    */
    RENDERDOCS: function(content, options) {
      const filePath = path.join(__dirname, options.path)
      const contents = fs.readFileSync(filePath, 'utf8')
      const docBlocs = dox.parseComments(contents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach(function(data) {
         updatedContent += data.description.full + '\n\n'
      });
      return updatedContent.replace(/^\s+|\s+$/g, '')
    }
  }
}

const markdownPath = path.join(__dirname, '..', 'README.md')
const callback = function(updatedContent, outputConfig) {
  // console.log('updated MD contents', updatedContent)
  console.log('Docs have been updated. Commit them!')
  const command = `git add ${outputConfig.originalPath}`
  const child = exec(command, {}, (error, stdout, stderr) => {
    if (error) {
      console.warn(error)
    }
    console.log(stdout)
  })
}
markdownSteriods(markdownPath, config, callback)
