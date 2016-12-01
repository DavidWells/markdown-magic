# Markdown Steriods

Automatically keep markdown files up to date from source code or via external sources.

This readme is generated with `markdown-steriods` [view the raw file](https://raw.githubusercontent.com/DavidWells/markdown-steroids/master/README.md) to see how.

## Install

```bash
npm install markdown-steriods --save-dev
```
## Usage
<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/exampleTwo.js) - Do not remove or modify this section -->
```js
import markdownSteriods from 'markdown-steriods'
import path from 'path'

const config = {} // optional
const markdownPath = path.join(__dirname, 'README.md')
markdownSteriods(markdownPath, config)
```
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

<!-- AUTO-GENERATED-CONTENT:START (RENDERDOCS:path=../index.js) - Do not remove or modify this section -->
### Function signature
```js
markdownSteriods(filename, config, callback)
// config and callback are optional params
```

### Configuration Options

`matchWord` - *string* - (optional) Comment pattern to look for & replace inner contents. Default `AUTO-GENERATED-CONTENT`

`commands` - *object* - (optional) Custom commands to transform block contents, see configuration options below.

`outputPath` - *string* - (optional) Change output path of new content. Default behavior is replacing the original file
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

### Commands (aka transforms)

Markdown Steriods comes with a couple of built in transforms for you to use or you can extend it with your own tranforms. See 'Custom Commands' below.

<!-- AUTO-GENERATED-CONTENT:START (RENDERDOCS:path=../commands.js) - Do not remove or modify this section -->
### - `CODE`

Get code from file or URL and put in markdown

**Options:**
- `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
- `syntax` (optional): Syntax will be inferred by fileType if not specified

**Example:**
```md
<-- MATCHWORD:START (CODE:src=./relative/path/to/code.js) -->
This content will be dynamically replaced with code from the file
<-- MATCHWORD:END -->
```
---

### - `REMOTE`

Get any remote Data and put in markdown

**Options:**
- `url`: The URL of the remote content to pull in

**Example:**
```md
<-- MATCHWORD:START (REMOTE:url=http://url-to-raw-md.md) -->
This content will be dynamically replace from the remote url
<-- MATCHWORD:END -->
```
---
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

## Custom Commands (aka transforms)

Markdown steriods is completely extendable and allows you to plugin in any rendering engine or logic you want in `config.commands`.

Below is an example that is used to generate this very markdown file from the projects source code.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/example.js) - Do not remove or modify this section -->
```js
const fs = require('fs')
const path = require('path')
const dox = require('dox')
const markdownSteriods = require('../index') // require('markdown-steriods')

const config = {
  commands: {
    // Update the content in comment matching
    // AUTO-GENERATED-CONTENT (customTransform:lolz=what&wow=dude)
    customTransform: function(content, options) {
      console.log('original innerContent', content) // "This content will get replaced"
      console.log(options) // { lolz: what, wow: dude}
      return `This will replace all the contents of inside the comment ${options.wow}`
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
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Other usage examples:

- [Serverless Community Plugin Repo](https://github.com/serverless/community-plugins/blob/master/generate-docs.js)

## Demo

View the raw source of this `README.md` file to see the comment block and see how the `customTransform` function in `example/example.js` works

<!-- AUTO-GENERATED-CONTENT:START (customTransform:lolz=what&wow=dude) - Do not remove or modify this section -->
This will replace all the contents of inside the comment dude
<!-- AUTO-GENERATED-CONTENT:END -->

## Prior Art

This was inspired by [Kent C Dodds](https://twitter.com/kentcdodds) and [jfmengels](https://github.com/jfmengels)'s [all contributors cli](https://github.com/jfmengels/all-contributors-cli) project.