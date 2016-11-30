# Markdown Steriods

Automatically keep markdown files up to date from source code or via external sources.

This readme is generated with `markdown-steriods` [view the raw file](https://raw.githubusercontent.com/DavidWells/markdown-steroids/master/README.md) to see how.

## Install

```bash
npm install markdown-steriods --save-dev
```

```js
import markdownSteriods from 'markdown-steriods'
markdownSteriods(markdownPath, config)
```

## Built in commands (aka transforms)

Markdown Steriods comes with a couple of built in transforms for you to use or you can extend it with your own tranforms. See 'Usage Example with Custom Transforms' below.

<!-- AUTO-GENERATED-CONTENT:START (listCommands) - Do not remove or modify this section -->
### `CODE`

Get code from file or URL and put in markdown

**Options**
- `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
- `syntax` (optional): Syntax will be inferred by fileType if not specified

**Example:**
```md
<-- MATCHWORD:START (CODE:src=./relative/path/to/code.js) -->
This content will be dynamically replaced with code from the file
<-- MATCHWORD:END -->
```

### `REMOTE`

Get any remote Data and put in markdown

**Options**
- `url`: The URL of the remote content to pull in

**Example:**
```md
<-- MATCHWORD:START (REMOTE:url=http://url-to-raw-md.md) -->
This content will be dynamically replace from the remote url
<-- MATCHWORD:END -->
```
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

## Usage Example with Custom Transforms
<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/example.js) - Do not remove or modify this section -->
```js
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
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Prior Art

This was inspired by the one and only [Kent C Dodds](https://twitter.com/kentcdodds) and his [all contributors](https://github.com/kentcdodds/all-contributors) project.

