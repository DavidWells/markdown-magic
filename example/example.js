/**
 * This example generated adds content to the repos README.md file
 */
const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index')

const config = {
  commands: {
    /* Custom transform example */
    customTransform: function(content, options) {
      console.log('original inner content', content)
      console.log(options) // { lolz: what, wow: dude}
      return 'This will replace all the contents of inside the comment block'
    },
    /**
     * This is used in the readme.md to generate the docs of `markdown-steroids`
     */
    listCommands: function(content, options) {
      const commandsFile = path.join(__dirname, '..', 'commands.js')
      const code = fs.readFileSync(commandsFile, 'utf8', (err, contents) => {
        if (err) {
          throw err
        }
        return contents
      })
      const doxOptions = {
        raw: true
      }
      let md = ''
      const comments = dox.parseComments(code, doxOptions);
      comments.forEach(function(data) {
         md += data.description.full + '\n\n'
      });
      return md.replace(/^\s+|\s+$/g, '')
    }
  },
  /* (optional) Specify different output path */
  // outputPath: path.join(__dirname, 'different-path.md')
}

const markdownPath = path.join(__dirname, '..', 'README.md')
// const markdownPath = path.join(__dirname, '..', 'test/fixtures/test.md')
markdownSteriods(markdownPath, config)