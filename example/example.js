const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index') // require('markdown-steriods')

const config = {
  commands: {
    // Update the content in comment matching
    // AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE)
    customTransform: function(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },

    // Update the content in comment matching
    // AUTO-GENERATED-CONTENT (RENDERDOCS:path=../file.js)
    RENDERDOCS: function(content, options) {
      const commandsFile = path.join(__dirname, options.path)
      const code = fs.readFileSync(commandsFile, 'utf8', (err, contents) => {
        if (err) {
          throw err
        }
        return contents
      })
      const doxOptions = {
        raw: true,
        skipSingleStar: true
      }
      let md = ''
      const comments = dox.parseComments(code, doxOptions);
      comments.forEach(function(data) {
         md += data.description.full + '\n\n'
      });
      return md.replace(/^\s+|\s+$/g, '')
    }
  },
  // outputPath: path.join(__dirname, 'different-path.md') // Specify different outputPath
}

const markdownPath = path.join(__dirname, '..', 'README.md')
const callback = function(updatedContent) {
  console.log('updated MD contents', updatedContent)
}
markdownSteriods(markdownPath, config, callback)
