# Remote Transform

This is normal text in markdown. Keep it.

<!-- doc-gen remote url="https://raw.githubusercontent.com/DavidWells/dom-guard/master/README.md" -->
# DOM Guard

Stop scammers from the manipulating DOM. [See demo](https://dom-guard.netlify.app)

## About

Scammers are using dev tools to manipulate values in pages to trick unsuspecting victims into sending them money. These victims are typically the elderly. 😢

They connect to their victim's machines via remote desktop software under the guise of tech support or some other well known company.

The scammer then attempts to convince the victim they have received a larger than expected "refund" by manipulating the victim's bank user interface via chrome dev tools with the goal of getting the victim to mail them cash.

See this video for [how the refund scams work](https://www.youtube.com/watch?v=J4mkZU2Y0as).

DOMGuard is a small javascript library (~130 lines of code) & proof of concept to help put an end to these criminals.

## How does this work?

Any changes attempted via Javascript are detected by MutationObserver.

Additionally, guarded DOM nodes are checked via a "hearbeat" every `500ms` to ensure the values are what they should be.

View the <a href="https://github.com/DavidWells/dom-guard/blob/master/index.js">source code</a>.

## Install

```bash
npm install dom-guard
```

## Usage

```js
import DOMGuard from 'dom-guard'

const guard = new DOMGuard({
  selector: '#protected', // DOM Selector to protect
  heartbeat: 1000 // Check for manipulation every 1 second
})

// Initialize DOMGuard on the #protected selector
guard.init()

// Turn off guard
guard.disable()
```

## Running the demo

```bash
npm install
npm run build
npm run serve
```

## Caveats

Please note, there isn't a foolproof solution for stopping social engineering attacks against your users.

Please educate your users on the dangers of these scams & add 2FA etc into your apps.
<!-- end-doc-gen -->

<!-- doc-gen remote url=https://raw.githubusercontent.com/DavidWells/markdown-magic/master/README.md -->
# Markdown Magic [![npm-version][npm-badge]][npm-link]

✨ Add a little magic to your markdown ✨

## About

<img align="right" width="200" height="183" src="https://cloud.githubusercontent.com/assets/532272/21507867/3376e9fe-cc4a-11e6-9350-7ec4f680da36.gif">Markdown magic uses comment blocks in markdown files to automatically sync or transform its contents.

- Automatically keep markdown files up to date from local or remote code sources
- Transform markdown content with custom transform functions
- Render markdown with any template engine
- Automatically generate a table of contents
- ... etc

The comments markdown magic uses are hidden in markdown and when viewed as HTML.

This `README.md` is generated with `markdown-magic` [view the raw file](https://raw.githubusercontent.com/DavidWells/markdown-magic/master/README.md) to see how.

[Video demo](http://www.youtube.com/watch?v=4V2utrvxwJ8) • [Example Repo](https://github.com/DavidWells/repo-using-markdown-magic)

## Table of Contents
<!-- ⛔️ MD-MAGIC-EXAMPLE:START (TOC:collapse=true&collapseText=Click to expand) -->
<details>
<summary>Click to expand</summary>

- [About](#about)
- [Install](#install)
- [Usage](#usage)
  - [API](#api)
  - [Configuration Options](#configuration-options)
- [CLI Usage](#cli-usage)
- [Transforms](#transforms)
  - [> TOC](#-toc)
  - [> CODE](#-code)
  - [> FILE](#-file)
  - [> REMOTE](#-remote)
- [Inline transforms](#inline-transforms)
- [🔌 Markdown magic plugins](#-markdown-magic-plugins)
- [Adding Custom Transforms](#adding-custom-transforms)
- [Plugin Example](#plugin-example)
- [Other usage examples](#other-usage-examples)
- [Custom Transform Demo](#custom-transform-demo)
- [Prior Art](#prior-art)
- [License](#license)
- [Usage examples](#usage-examples)

</details>
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

## Install

```bash
npm install markdown-magic --save-dev
```

## Usage
<!-- ⛔️ MD-MAGIC-EXAMPLE:START (CODE:src=./examples/1-_basic-usage.js) -->
<!-- The below code snippet is automatically added from ./examples/basic-usage.js -->
```js
import path from 'path'
import markdownMagic from 'markdown-magic'

const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END *-->


<!-- ⛔️ MD-MAGIC-EXAMPLE:START (RENDERDOCS:path=./lib/index.js)
- Do not remove or modify this section -->
### API
```js
markdownMagic(filePath, config, callback)
```
- `filePaths` - *String or Array* - Path or glob pattern. Uses [globby patterns](https://github.com/sindresorhus/multimatch/blob/master/test.js)
- `config` - See configuration options below
- `callback` - callback to run after markdown updates
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (RENDERDOCS:path=./lib/processFile.js)
- Do not remove or modify this section -->
### Configuration Options

- `transforms` - *object* - (optional) Custom commands to transform block contents, see transforms & custom transforms sections below.

- `outputDir` - *string* - (optional) Change output path of new content. Default behavior is replacing the original file

- `matchWord` - *string* - (optional) Comment pattern to look for & replace inner contents. Default `AUTO-GENERATED-CONTENT`

- `DEBUG` - *Boolean* - (optional) set debug flag to `true` to inspect the process
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

## CLI Usage

You can use `markdown-magic` as a CLI command. Run `markdown --help` to see all available CLI options

```bash
markdown --help
# or
md-magic
```

This is useful for adding the package quickly to your `package.json` npm scripts

CLI usage example with options

```bash
md-magic --path '**/*.md' --config ./config.file.js
```

In NPM scripts, `npm run docs` would run the markdown magic and parse all the `.md` files in the directory.

```json
"scripts": {
  "docs": "md-magic --path '**/*.md' --ignore 'node_modules'"
},
```

If you have a `markdown.config.js` file where `markdown-magic` is invoked, it will automatically use that as the configuration unless otherwise specified by `--config` flag.

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (CODE:src=./markdown.config.js) -->
<!-- The below code snippet is automatically added from ./markdown.config.js -->
```js
/* CLI markdown.config.js file example */
module.exports = {
  matchWord: 'MD-MAGIC-EXAMPLE',
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (LOLZ) --> */
    LOLZ(content, options) {
      return `This section was generated by the cli config markdown.config.js file`
    }
  },
  callback: function () {
    console.log('markdown processing done')
  }
}
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END *-->

## Transforms

Markdown Magic comes with a couple of built-in transforms for you to use or you can extend it with your own transforms. See 'Custom Transforms' below.

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (RENDERDOCS:path=./lib/transforms/index.js) - Do not remove or modify this section -->
### > TOC

Generate table of contents from markdown file

**Options:**
- `firsth1` - *boolean* - (optional): Show first h1 of doc in table of contents. Default `false`
- `collapse` - *boolean* - (optional): Collapse the table of contents in a detail accordian. Default `false`
- `collapseText` - *string* - (optional): Text the toc accordian summary
- `excludeText` - *string* - (optional): Text to exclude in the table of contents. Default `Table of Contents`
- `maxDepth` - *number* - (optional): Max depth of headings. Default 4

**Example:**
```md
<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
toc will be generated here
<!-- AUTO-GENERATED-CONTENT:END -->
```

Default `MATCHWORD` is `AUTO-GENERATED-CONTENT`

---

### > CODE

Get code from file or URL and put in markdown

**Options:**
- `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
- `syntax` (optional): Syntax will be inferred by fileType if not specified
- `header` (optional): Will add header comment to code snippet. Useful for pointing to relative source directory or adding live doc links
- `lines` (optional): a range with lines of code which will then be replaced with code from the file. The line range should be defined as: "lines=*startLine*-*EndLine*" (for example: "lines=22-44"). Please see the example below

**Example:**
```md
<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./relative/path/to/code.js) -->
This content will be dynamically replaced with code from the file
<!-- AUTO-GENERATED-CONTENT:END -->
```

```md
 <!-- AUTO-GENERATED-CONTENT:START (CODE:src=./relative/path/to/code.js&lines=22-44) -->
 This content will be dynamically replaced with code from the file lines 22 through 44
 <!-- AUTO-GENERATED-CONTENT:END -->
 ```

Default `MATCHWORD` is `AUTO-GENERATED-CONTENT`

---

### > FILE

Get local file contents.

**Options:**
- `src`: The relative path to the file to pull in

**Example:**
```md
<!-- AUTO-GENERATED-CONTENT:START (FILE:src=./path/to/file) -->
This content will be dynamically replaced from the local file
<!-- AUTO-GENERATED-CONTENT:END -->
```

Default `MATCHWORD` is `AUTO-GENERATED-CONTENT`

---

### > REMOTE

Get any remote Data and put in markdown

**Options:**
- `url`: The URL of the remote content to pull in

**Example:**
```md
<!-- AUTO-GENERATED-CONTENT:START (REMOTE:url=http://url-to-raw-md-file.md) -->
This content will be dynamically replaced from the remote url
<!-- AUTO-GENERATED-CONTENT:END -->
```

Default `MATCHWORD` is `AUTO-GENERATED-CONTENT`

---
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

## Inline transforms

Any transform, including custom transforms can be used inline as well to insert content into paragraphs and other places.

The face symbol 👉 <!-- MD-MAGIC-EXAMPLE:START (INLINE_EXAMPLE) -->**⊂◉‿◉つ**<!-- MD-MAGIC-EXAMPLE:END --> is auto generated inline.

**Example:**
```md
<!-- AUTO-GENERATED-CONTENT:START (FILE:src=./path/to/file) -->xyz<!-- AUTO-GENERATED-CONTENT:END -->
```

## 🔌 Markdown magic plugins

* [wordcount](https://github.com/DavidWells/markdown-magic-wordcount/) - Add wordcount to markdown files
* [github-contributors](https://github.com/DavidWells/markdown-magic-github-contributors) - List out the contributors of a given repository
* [directory-tree](https://github.com/camacho/markdown-magic-directory-tree) - Add directory tree to markdown files
* [install-command](https://github.com/camacho/markdown-magic-install-command) - Add install command to markdown files with `peerDependencies` included
* [subpackage-list](https://github.com/camacho/markdown-magic-subpackage-list) - Add list of all subpackages (great for projects that use [Lerna](https://github.com/lerna/lerna))
* [version-badge](https://github.com/camacho/markdown-magic-version-badge) - Add a badge with the latest version of the project
* [template](https://github.com/camacho/markdown-magic-template) - Add Lodash template support
* [dependency-table](https://github.com/camacho/markdown-magic-dependency-table) - Add a table of dependencies with links to their repositories, version information, and a short description
* [package-scripts](https://github.com/camacho/markdown-magic-package-scripts) - Add a table of `package.json` scripts with descriptions
* [prettier](https://github.com/camacho/markdown-magic-prettier) - Format code blocks with [`prettier`](https://github.com/prettier/prettier)
* [engines](https://github.com/camacho/markdown-magic-engines) - Print engines list from `package.json`
* [jsdoc](https://github.com/bradtaylorsf/markdown-magic-jsdoc) - Adds jsdoc comment support
* [build-badge](https://github.com/rishichawda/markdown-magic-build-badge) - Update branch badges to auto-magically point to current branches.
* [package-json](https://github.com/forresst/markdown-magic-package-json) - Add the package.json properties to markdown files
* [figlet](https://github.com/lafourchette/markdown-magic-figlet) - Add FIGfont text to markdown files
* [local-image](https://github.com/stevenbenisek/markdown-magic-local-image) - plugin to add local images to markdown
* [markdown-magic-build-badge](https://github.com/rishichawda/markdown-magic-build-badge) - A plugin to update your branch badges to point to correct branch status

## Adding Custom Transforms

Markdown Magic is extendable via plugins.

Plugins allow developers to add new transforms to the `config.transforms` object. This allows for things like using different rendering engines, custom formatting, or any other logic you might want.

Plugins run in order of registration.

The below code is used to generate **this markdown file** via the plugin system.

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (CODE:src=./examples/generate-readme.js) -->
<!-- The below code snippet is automatically added from ./examples/generate-readme.js -->
```js
const fs = require('fs')
const path = require('path')
const markdownMagic = require('../index')
// const markdownMagic = require('markdown-magic')

const config = {
  matchWord: 'MD-MAGIC-EXAMPLE', // default matchWord is AUTO-GENERATED-CONTENT
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (customTransform:optionOne=hi&optionOne=DUDE) --> */
    customTransform(content, options) {
      console.log('original content in comment block', content)
      console.log('options defined on transform', options)
      // options = { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START (RENDERDOCS:path=../file.js) --> */
    RENDERDOCS(content, options) {
      const fileContents = fs.readFileSync(options.path, 'utf8')
      const docBlocs = require('doxxx').parseComments(fileContents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach((data) => {
        updatedContent += `${data.description.full}\n\n`
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    INLINE_EXAMPLE: () => {
      return '**⊂◉‿◉つ**'
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START (pluginExample) --> */
    pluginExample: require('./plugin-example')({ addNewLine: true }),
    /* Include plugins from NPM */
    // count: require('markdown-magic-wordcount'),
    // github: require('markdown-magic-github-contributors')
  }
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownMagic(markdownPath, config, () => {
  console.log('Docs ready')
})
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

## Plugin Example

Plugins must return a transform function with the following signature.

```js
return function myCustomTransform (content, options)
```

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (CODE:src=./examples/plugin-example.js) -->
<!-- The below code snippet is automatically added from ./examples/plugin-example.js -->
```js
/* Custom Transform Plugin example */
const merge = require('deepmerge')
module.exports = function customPlugin(pluginOptions) {
  // set plugin defaults
  const defaultOptions = {
    addNewLine: false
  }
  const userOptions = pluginOptions || {}
  const pluginConfig = merge(defaultOptions, userOptions)
  // return the transform function
  return function myCustomTransform (content, options) {
    const newLine = (pluginConfig.addNewLine) ? '\n' : ''
    const updatedContent = content + newLine
    return updatedContent
  }
}
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

[View the raw file](https://raw.githubusercontent.com/DavidWells/markdown-magic/master/README.md) file and run `npm run docs` to see this plugin run
<!-- ⛔️ MD-MAGIC-EXAMPLE:START (pluginExample) ⛔️ -->
This content is altered by the `pluginExample` plugin registered in `examples/generate-readme.js`

<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

## Other usage examples

- [With Github Actions](https://github.com/dineshsonachalam/repo-using-markdown-autodocs)
- [Serverless Plugin Repo](https://github.com/serverless/plugins/blob/master/generate-docs.js) this example takes a `json` file and converts it into a github flavored markdown table
- [MochaJS](https://github.com/mochajs/mocha/blob/4cc711fa00f7166a2303b77bf2487d1c2cc94621/scripts/markdown-magic.config.js)
- [tc39/agendas](https://github.com/tc39/agendas#agendas) - [code](https://github.com/tc39/agendas/blob/65945b1b6658e9829ef95a51bf2632ff44f951e6/scripts/generate.js)
- [moleculerjs/moleculer-addons](https://github.com/moleculerjs/moleculer-addons/blob/7cf0f72140717c52621b724cd54a710517106df0/readme-generator.js)
- [good-first-issue](https://github.com/bnb/good-first-issue/blob/e65513a1f26167dea3c137008b8796640d8d5303/markdown.config.js)
- [navikt/nav-frontend-moduler](https://github.com/navikt/nav-frontend-moduler/blob/20ad521c27a43d3203eab4bc32121e5b8270c077/_scripts/generateReadmes.js)
- [country-flags-svg](https://github.com/ronatskiy/country-flags-svg/blob/cfb2368c7e634ebc1679855e13cc3e26ca11187f/markdown.config.js)
- [react-typesetting](https://github.com/exogen/react-typesetting/blob/7114cdc8c4cb1b0d59ebc8b5364e808687419889/markdown.config.js)
- [and many more!](https://github.com/search?o=desc&p=1&q=markdown-magic+filename%3Apackage.json+-user%3Ah13i32maru+-user%3Aesdoc+-user%3Aes-doc&s=indexed&type=Code)

## Custom Transform Demo

View the raw source of this `README.md` file to see the comment block and see how the `customTransform` function in `examples/generate-readme.js` works

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (customTransform:optionOne=hi&optionOne=DUDE) - Do not remove or modify this section -->
This will replace all the contents of inside the comment DUDE
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

## Prior Art

This was inspired by [Kent C Dodds](https://twitter.com/kentcdodds) and [jfmengels](https://github.com/jfmengels)'s [all contributors cli](https://github.com/jfmengels/all-contributors-cli) project.

## License

[MIT][mit] © [DavidWells][author]

[npm-badge]:https://img.shields.io/npm/v/markdown-magic.svg?style=flat-square
[npm-link]: http://www.npmjs.com/package/markdown-magic
[mit]:      http://opensource.org/licenses/MIT
[author]:   http://github.com/davidwells

## Usage examples

- [Project using markdown-magic](https://github.com/search?o=desc&q=filename%3Apackage.json+%22markdown-magic%22&s=indexed&type=Code)
- [Examples in md](https://github.com/search?l=Markdown&o=desc&q=AUTO-GENERATED-CONTENT&s=indexed&type=Code)


## Misc Markdown helpers

- https://github.com/azu/markdown-function
<!-- end-doc-gen -->

This is normal text in markdown. Keep it.
