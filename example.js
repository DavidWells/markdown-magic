const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('./index')

const opts = {
  commands: {
    /**
     * Custom transform command matching CUSTOM
     *
     * AUTO-GENERATED-CONTENT:START (CUSTOM:lolz=what&wow=dude)
     */
    CUSTOM: function(content, options) {
      console.log('original inner content', content)
      console.log(options) // { lolz: what, wow: dude}
      return 'This will replace all the contents of inside the comment block'
    },
    /**
     * Custom transform command matching LIST_COMMANDS
     *
     * AUTO-GENERATED-CONTENT:START (LIST_COMMANDS)
     */
    LIST_COMMANDS: function(content, options) {
      const commandsFile = path.join(__dirname, 'commands.js')
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
      console.log('result', md)
      return md.replace(/^\s+|\s+$/g, '')
    }
  },
  /* (optional) Specify different output path */
  // outputPath: path.join(__dirname, 'different-path.md')
}

const markdownPath = path.join(__dirname, 'README.md')
markdownSteriods(markdownPath, opts)