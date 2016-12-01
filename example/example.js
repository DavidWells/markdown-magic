/**
 * This example generated adds content to the repos README.md file
 */
const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index')

const config = {
  commands: {
    /* Custom transform example
      In README.md the below comment block adds the list to the readme
      <!-- MATCHWORD:START (customTransform:lolz=what&wow=dude)-->
        This content will get replaced
      <!-- MATCHWORD:END -->
    */
    customTransform: function(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { lolz: what, wow: dude}
      return `This will replace all the contents of inside the comment ${options.wow}`
    },
    /**
     * This is used in the README.md to generate the docs of `markdown-steroids`
     */
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
      console.log('comments', comments[0])
      comments.forEach(function(data) {
         md += data.description.full + '\n\n'
      });
      return md.replace(/^\s+|\s+$/g, '')
    }
  },
  // outputPath: path.join(__dirname, 'different-path.md') // Specify different outputPath
}

const markdownPath = path.join(__dirname, '..', 'README.md')
// const markdownPath = path.join(__dirname, '..', 'test/fixtures/test.md')
markdownSteriods(markdownPath, config, (updatedContent) => {
  // callback on completion
  // console.log(updatedContent)
})
