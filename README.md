# Markdown Steriods

Automatically keep markdown files up to date with external sources and code snippets

## Install

`npm install markdown-steriods --save-dev`

## Usage

**Built in commands:**
<!-- AUTO-GENERATED-CONTENT:START (LIST_COMMANDS) - Do not remove or modify this section -->
### `CODE`

Get code from file or URL and put in markdown

**Options**
- `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
- `syntax` (optional): Syntax will be inferred by fileType if not specified

### `REMOTE`

Get any remote Data and put in markdown

**Options**
- `url`: The URL of the remote content to pull in

Usage:
```
<-- MATCHWORD:START (REMOTE:url=http://url-to-raw-md.md) -->
content to be dynamically replaced
<-- MATCHWORD:END -->
```
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/example.js) - Do not remove or modify this section -->
```js
/**
 * This example generated adds content to the repos README.md file
 */
const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index')

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
markdownSteriods(markdownPath, opts)
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Prior Art

This was inspired by the one and only [Kent C Dodds](https://twitter.com/kentcdodds) and his [all contributors](https://github.com/kentcdodds/all-contributors) project.

