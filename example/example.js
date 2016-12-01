const fs = require('fs')
const path = require('path')
const dox = require('dox')
// require('markdown-steriods') lib
const markdownSteriods = require('../index')

const config = {
  commands: {
    /* Update the content in comment matching
       AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE)
    */
    customTransform: function(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Update the content in comment matching
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
  },
  /* Optionally Specify different outputPath than overiding existing file */
  // outputPath: path.join(__dirname, 'different-path.md')
}

const markdownPath = path.join(__dirname, '..', 'README.md')
const callback = function(updatedContent) {
  console.log('updated MD contents', updatedContent)
}
markdownSteriods(markdownPath, config, callback)
