# Markdown Steriods

Automatically keep markdown files up to date from source code or via external sources.

This readme is generated with `markdown-steriods` [view the raw file](https://raw.githubusercontent.com/DavidWells/markdown-steroids/master/README.md) to see how.

## Install

```bash
npm install markdown-steriods --save-dev
```
## Usage
<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/basic-usage.js) - Do not remove or modify this section -->
```js
import markdownSteriods from 'markdown-steriods'
import path from 'path'

const markdownPath = path.join(__dirname, 'README.md')
markdownSteriods(markdownPath)
```
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

<!-- AUTO-GENERATED-CONTENT:START (RENDERDOCS:path=../index.js) - Do not remove or modify this section -->
### Function signature
```js
markdownSteriods(filename, config, callback)
// Configuration and callback are optional params
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

This code is used to generate **this markdown file**:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./example/generate-docs.js) - Do not remove or modify this section -->
```js
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


const callback = function(updatedContent, outputConfig) {
  console.log('Docs have been updated. Commit them!')
  const gitAdd = `git add ${outputConfig.originalPath}`
  const runGitAdd = exec(gitAdd, {}, (error) => {
    if (error) console.warn(error)
    console.log(`git add ${outputConfig.originalPath} ran`)
  })
  const msg = `${path.basename(outputConfig.originalPath)} automatically updated by markdown-steriods`
  const gitCommit = `git commit -m '${msg}'`
  console.log('gitCommit', gitCommit)
  const runGitCommit = exec(gitCommit, {}, (error) => {
    if (error) console.warn(error)
    console.log(`git commit automatically ran. Push up your changes!`)
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownSteriods(markdownPath, config, callback)
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Other usage examples:

- [Serverless Community Plugin Repo](https://github.com/serverless/community-plugins/blob/master/generate-docs.js)

## Demo

View the raw source of this `README.md` file to see the comment block and see how the `customTransform` function in `example/generate-docs.js` works

<!-- AUTO-GENERATED-CONTENT:START (customTransform:optionOne=hi&optionOne=DUDE) - Do not remove or modify this section -->
This will replace all the contents of inside the comment DUDE
<!-- AUTO-GENERATED-CONTENT:END - Do not remove or modify this section -->

## Prior Art

This was inspired by [Kent C Dodds](https://twitter.com/kentcdodds) and [jfmengels](https://github.com/jfmengels)'s [all contributors cli](https://github.com/jfmengels/all-contributors-cli) project.