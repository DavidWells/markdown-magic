const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index') // require('markdown-steriods')

const config = {
  commands: {
    /* In README.md the below comment block adds the list to the readme
      // note: MATCHWORD default is 'AUTO-GENERATED-CONTENT'
      <!-- MATCHWORD:START (customTransform:lolz=what&wow=dude)-->
        This content will get replaced
      <!-- MATCHWORD:END -->
    */
    customTransform: function(content, options) {
      console.log('original innerContent', content) // "This content will get replaced"
      console.log(options) // { lolz: what, wow: dude}
      return `This will replace all the contents of inside the comment ${options.wow}`
    },
    /* <!-- MATCHWORD:START (RENDERDOCS:path=../file.js)-->
        This content will get replaced with auto generated docs
       <!-- MATCHWORD:END -->
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
