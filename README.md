# Markdown Magic [![npm-version][npm-badge]][npm-link]

✨ Add a little magic to your markdown! ✨

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
<!-- ⛔️ MD-MAGIC-EXAMPLE:START TOC collapseText="Click to expand" -->
<details>
<summary>Click to expand</summary>

- [About](#about)
- [Install](#install)
- [Usage](#usage)
  - [Running via CLI](#running-via-cli)
  - [Running programmatically](#running-programmatically)
- [Syntax Examples](#syntax-examples)
  - [Basic](#basic)
  - [Curly braces](#curly-braces)
  - [Square brackets](#square-brackets)
  - [Parentheses](#parentheses)
  - [Functions](#functions)
  - [API](#api)
    - [`MarkdownMagicOptions`](#markdownmagicoptions)
    - [`OutputConfig`](#outputconfig)
    - [`MarkdownMagicResult`](#markdownmagicresult)
- [Transforms](#transforms)
  - [> TOC](#-toc)
  - [> CODE](#-code)
  - [> FILE](#-file)
  - [> REMOTE](#-remote)
  - [> fileTree](#-filetree)
  - [> install](#-install)
- [Inline transforms](#inline-transforms)
- [Legacy v1 & v2 plugins](#legacy-v1--v2-plugins)
- [Adding Custom Transforms](#adding-custom-transforms)
- [Plugin Example](#plugin-example)
- [Other usage examples](#other-usage-examples)
- [Custom Transform Demo](#custom-transform-demo)
- [Usage examples](#usage-examples)
- [Misc Markdown helpers](#misc-markdown-helpers)
- [Prior Art](#prior-art)
- [License](#license)

</details>
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START FILE src=./docs/1-getting-started.md -->
## Install

**Via npm**

```bash
npm install markdown-magic --save-dev
```

**Via binary (no Node.js required)**

Download the prebuilt binary for your platform from [GitHub Releases](https://github.com/DavidWells/markdown-magic/releases):

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/DavidWells/markdown-magic/releases/latest/download/md-magic-darwin-arm64 -o md-magic
chmod +x md-magic

# macOS (Intel)
curl -fsSL https://github.com/DavidWells/markdown-magic/releases/latest/download/md-magic-darwin-x64 -o md-magic
chmod +x md-magic

# Linux (x64)
curl -fsSL https://github.com/DavidWells/markdown-magic/releases/latest/download/md-magic-linux-x64 -o md-magic
chmod +x md-magic

# Linux (ARM64)
curl -fsSL https://github.com/DavidWells/markdown-magic/releases/latest/download/md-magic-linux-arm64 -o md-magic
chmod +x md-magic
```

## Usage

Use comment blocks in your markdown

**Example:**
```md
<!-- docs remote url=http://url-to-raw-md-file.md -->
This content will be dynamically replaced from the remote url
<!-- /docs -->
```

Then run `markdown-magic` via it's CLI or programmatically.

### Running via CLI

Run `markdown --help` to see all available CLI options

```bash
markdown
# or
md-magic
```

CLI usage example with options

```bash
md-magic --file '**/*.md' --config ./config.file.js
```

In NPM scripts, `npm run docs` would run the markdown magic and parse all the `.md` files in the directory.

```json
"scripts": {
  "docs": "md-magic --file '**/*.md'"
},
```

If you have an `md.config.js` or `markdown.config.js` file where `markdown-magic` is invoked, it will automatically use that as the configuration unless otherwise specified by `--config` flag.

### Running programmatically

```js
const { markdownMagic } = require('../src')

/* By default all .md files in cwd will be processed */
markdownMagic().then((results) => {
  console.log('result keys', Object.keys(results))
})
```

```js
import path from 'path'
import markdownMagic from 'markdown-magic'

// Process a Single File
const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
```

### Running in GitHub Actions

Use the prebuilt binary to automatically update markdown files on push:

```yaml
name: Update Markdown

on:
  push:
    paths:
      - '**.md'
      - 'src/**'

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download md-magic
        run: |
          curl -fsSL https://github.com/DavidWells/markdown-magic/releases/latest/download/md-magic-linux-x64 -o md-magic
          chmod +x md-magic

      - name: Run markdown-magic
        run: ./md-magic --files '**/*.md'

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git diff --staged --quiet || git commit -m "docs: update markdown"
          git push
```

#### Alternative GitHub Actions

- [markdown-code-inject](https://github.com/Cox65/markdown-code-inject) - Inject code snippets into markdown
- [markdown-autodocs](https://github.com/dineshsonachalam/markdown-autodocs) - Auto-generate docs from code
<!-- ⛔️ MD-MAGIC-EXAMPLE:END *-->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (FILE:src=./docs/2-syntax-reference.md) -->
## Syntax Examples

There are various syntax options. Choose your favorite.

### Basic

`openWord transformName [opts]`

```md
<!-- docs transformName optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Curly braces

`openWord {transformName} [opts]`

```md
<!-- docs {transformName} optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Square brackets

`openWord [transformName] [opts]`

```md
<!-- docs [transformName] optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Parentheses

`openWord (transformName) [opts]`

```md
<!-- docs (transformName) optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Functions

`openWord transformName([opts])`

```md
<!-- docs transformName(
  foo='bar'
  baz=['qux', 'quux']
) -->
content to be replaced
<!-- /docs -->
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END *-->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START JSDocs path="./src/index.js" -->
### API

Markdown Magic Instance

```js
markdownMagic(globOrOpts, options)
```

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `globOrOpts` | `FilePathsOrGlobs or MarkdownMagicOptions` | Files to process or config. |
| `options` (optional) | `MarkdownMagicOptions` | Markdown magic config. |

**Returns**

`Promise<MarkdownMagicResult>`

**Example**

```js
markdownMagic(['**.**.md'], options).then((result) => {
  console.log(`Processing complete`, result)
})
```

#### `MarkdownMagicOptions`

Configuration for markdown magic

Below is the main config for `markdown-magic`

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `files` (optional) | `FilePathsOrGlobs` | Files to process. |
| `transforms` (optional) | `Array` | Custom commands to transform block contents, see transforms & custom transforms sections below. Default: `defaultTransforms` |
| `output` (optional) | `OutputConfig` | Output configuration. |
| `syntax` (optional) | `SyntaxType` | Syntax to parse. Default: `md` |
| `open` (optional) | `string` | Opening match word. Default: `docs` |
| `close` (optional) | `string` | Closing match word. If not defined will be same as opening word. Default: `/docs` |
| `cwd` (optional) | `string` | Current working directory. Default process.cwd(). Default: `process.cwd() ` |
| `outputFlatten` (optional) | `boolean` | Flatten files that are output. |
| `useGitGlob` (optional) | `boolean` | Use git glob for LARGE file directories. |
| `dryRun` (optional) | `boolean` | See planned execution of matched blocks. Default: `false` |
| `debug` (optional) | `boolean` | See debug details. Default: `false` |
| `silent` (optional) | `boolean` | Silence all console output. Default: `false` |
| `applyTransformsToSource` (optional) | `boolean` | Apply transforms to source file. Default is true. Default: `true` |
| `failOnMissingTransforms` (optional) | `boolean` | Fail if transform functions are missing. Default skip blocks. Default: `false` |
| `failOnMissingRemote` (optional) | `boolean` | Fail if remote file is missing. Default: `true` |

#### `OutputConfig`

Optional output configuration

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `directory` (optional) | `string` | Change output path of new content. Default behavior is replacing the original file. |
| `removeComments` (optional) | `boolean` | Remove comments from output. Default is false. Default: `false` |
| `pathFormatter` (optional) | `function` | Custom function for altering output paths. |
| `applyTransformsToSource` (optional) | `boolean` | Apply transforms to source file. Default is true. This is for when outputDir is set. Default: `false` |

#### `MarkdownMagicResult`

Result of markdown processing

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `errors` | `Array` | Any errors encountered. |
| `filesChanged` | `Array<string>` | Modified files. |
| `results` | `Array` | md data. |
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

## Transforms

Markdown Magic comes with a couple of built-in transforms for you to use or you can extend it with your own transforms. See 'Custom Transforms' below.

<!-- ⛔️ MD-MAGIC-EXAMPLE:START JSDocs path="./src/transforms/index.js" -->
### > TOC

Generate table of contents from markdown file

**Options:**
- `firstH1` - *boolean* - (optional): Show first h1 of doc in table of contents. Default `false`
- `collapse` - *boolean* - (optional): Collapse the table of contents in a detail accordion. Default `false`
- `collapseText` - *string* - (optional): Text the toc accordion summary
- `excludeText` - *string* - (optional): Text to exclude in the table of contents. Default `Table of Contents`
- `maxDepth` - *number* - (optional): Max depth of headings. Default 4

**Example:**
```md
<!-- docs TOC -->
toc will be generated here
<!-- /docs -->
```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |

### > CODE

Get code from file or URL and put in markdown

**Options:**
- `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
- `syntax` (optional): Syntax will be inferred by fileType if not specified
- `header` (optional): Will add header comment to code snippet. Useful for pointing to relative source directory or adding live doc links
- `lines` (optional): a range with lines of code which will then be replaced with code from the file. The line range should be defined as: "lines=*startLine*-*EndLine*" (for example: "lines=22-44"). Please see the example below

**Example:**
```md
<!-- docs CODE src="./relative/path/to/code.js" -->
This content will be dynamically replaced with code from the file
<!-- /docs -->
```

```md
 <!-- docs CODE src="./relative/path/to/code.js" lines=22-44 -->
 This content will be dynamically replaced with code from the file lines 22 through 44
 <!-- /docs -->
 ```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |

### > FILE

Get local file contents.

**Options:**
- `src`: The relative path to the file to pull in

**Example:**
```md
<!-- docs FILE src=./path/to/file -->
This content will be dynamically replaced from the local file
<!-- /docs -->
```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |

### > REMOTE

Get any remote Data and put in markdown

**Options:**
- `url`: The URL of the remote content to pull in

**Example:**
```md
<!-- docs REMOTE url=http://url-to-raw-md-file.md -->
This content will be dynamically replaced from the remote url
<!-- /docs -->
```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |

### > fileTree

Generate a file tree table of contents

**Options:**
- `src` (optional): The directory path to generate the file tree for. Default `.` (current directory)
- `maxDepth` (optional): Maximum depth to traverse in the directory tree. Default `3`
- `includeFiles` (optional): Whether to include files in the tree or just directories. Default `true`
- `exclude` (optional): Array of glob patterns to exclude from the tree. Default `[]`
- `showSize` (optional): Whether to show file sizes. Default `false`
- `format` (optional): Output format: "tree" or "list". Default `"tree"`

**Example:**
```md
<!-- docs fileTree src="./src" maxDepth=2 -->
file tree will be generated here
<!-- /docs -->
```

**Example Output (tree format):**
```
└── src/
    ├── transforms/
    │   ├── code/
    │   │   ...
    │   ├── fileTree.js
    │   ├── index.js
    │   └── toc.js
    ├── utils/
    │   ├── fs.js
    │   ├── logs.js
    │   └── text.js
    └── index.js
```

**Example Output (list format):**
```md
- **src/**
  - **transforms/**
    - **code/**
      - ...
    - fileTree.js
    - index.js
    - toc.js
  - **utils/**
    - fs.js
    - logs.js
    - text.js
  - index.js
```

**Example with file sizes:**
```
└── src/
    ├── index.js (15.2 KB)
    └── package.json (552 B)
```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |

### > install

Generate installation instructions in a markdown table format

**Options:**
- `packageName` (optional): The name of the package to install. If not provided, will try to read from package.json
- `isDev` (optional): Whether to install the package as a dev dependency. Default `false`
- `header` (optional): The header to use for the installation instructions. Default `# Installation`
- `body` (optional): The body to use for the installation instructions. Default `Install the \`${packageName}\` cli using your favorite package manager.`

**Example:**
```md
<!-- docs install -->
Installation instructions will be generated here
<!-- /docs -->
```

Default `matchWord` is `docs`

---

| Name | Type | Description |
|:---------------------------|:---------------:|:-----------|
| `content` | `string` | The current content of the comment block. |
| `options` | `object` | The options passed in from the comment declaration. |
<!-- ⛔️ MD-MAGIC-EXAMPLE:END - Do not remove or modify this section -->

## Inline transforms

Any transform, including custom transforms can be used inline as well to insert content into paragraphs and other places.

The face symbol 👉 <!-- MD-MAGIC-EXAMPLE:START (INLINE_EXAMPLE) -->**⊂◉‿◉つ**<!-- MD-MAGIC-EXAMPLE:END --> is auto generated inline.

**Example:**
```md
<!-- docs (FILE:src=./path/to/file) -->xyz<!-- /docs -->
```

## Legacy v1 & v2 plugins

These plugins work with older versions of markdown-magic. Adapting them to the newer plugin syntax should be pretty straight forward.

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
* [markdown-magic-json-path](https://github.com/mariohamann/markdown-magic-json-path) – Extract and insert specific values from any JSON file into your Markdown documents.

## Adding Custom Transforms

Markdown Magic is extendable via plugins.

Plugins allow developers to add new transforms to the `config.transforms` object. This allows for things like using different rendering engines, custom formatting, or any other logic you might want.

Plugins run in order of registration.

The below code is used to generate **this markdown file** via the plugin system.

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (CODE:src=./examples/generate-readme.js) -->
```js
const path = require('path')
const { readFileSync } = require('fs')
const { parseComments } = require('doxxx')
const { markdownMagic } = require('../src')
const { deepLog } = require('../src/utils/logs')

const config = {
  matchWord: 'MD-MAGIC-EXAMPLE', // default matchWord is AUTO-GENERATED-CONTENT
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (customTransform:optionOne=hi&optionOne=DUDE) --> */
    customTransform({ content, options }) {
      console.log('original content in comment block', content)
      console.log('options defined on transform', options)
      // options = { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START JSDocs path="../file.js" --> */
    JSDocs(markdownMagicPluginAPI) {
      const { options } = markdownMagicPluginAPI
      const fileContents = readFileSync(options.path, 'utf8')
      const docBlocs = parseComments(fileContents, { skipSingleStar: true })
        .filter((item) => {
          return !item.isIgnored
        })
        /* Remove empty comments with no tags */
        .filter((item) => {
          return item.tags.length
        })
        /* Remove inline type defs */
        .filter((item) => {
          return item.description.text !== ''
        })
        /* Sort types to end */
        .sort((a, b) => {
          if (a.type && !b.type) return 1
          if (!a.type && b.type) return -1
          return 0
        })

      docBlocs.forEach((data) => {
        // console.log('data', data)
        delete data.code
      })
      // console.log('docBlocs', docBlocs)

      if (docBlocs.length === 0) {
        throw new Error('No docBlocs found')
      }

      // console.log(docBlocs.length)
      let updatedContent = ''
      docBlocs.forEach((data) => {
        if (data.type) {
          updatedContent += `#### \`${data.type}\`\n\n`
        }

        updatedContent += `${data.description.text}\n`

        if (data.tags.length) {
         let table =  '| Name | Type | Description |\n'
          table += '|:---------------------------|:---------------:|:-----------|\n'
          data.tags.filter((tag) => {
            if (tag.tagType === 'param') return true
            if (tag.tagType === 'property') return true
            return false
          }).forEach((tag) => {
            const optionalText = tag.isOptional ? ' (optional) ' : ' '
            const defaultValueText = (typeof tag.defaultValue !== 'undefined') ? ` Default: \`${tag.defaultValue}\` ` : ' '
            table += `| \`${tag.name}\`${optionalText}`
            table += `| \`${tag.type.replace('|', 'or')}\` `
            table += `| ${tag.description.replace(/\.\s?$/, '')}.${defaultValueText}|\n`
          })
          updatedContent+= `\n${table}\n`

          const returnValues = data.tags.filter((tag) => tag.tagType === 'returns')
          if (returnValues.length) {
            returnValues.forEach((returnValue) => {
              updatedContent += `**Returns**\n\n`
              updatedContent += `\`${returnValue.type}\`\n\n`
            })
          }

          const examples = data.tags.filter((tag) => tag.tagType === 'example')
          if (examples.length) {
            examples.forEach((example) => {
              updatedContent += `**Example**\n\n`
              updatedContent += `\`\`\`js\n${example.tagValue}\n\`\`\`\n\n`
            })
          }
        }
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    INLINE_EXAMPLE: () => {
      return '**⊂◉‿◉つ**'
    },
    lolz() {
      return `This section was generated by the cli config md.config.js file`
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
```js
/* Custom Transform Plugin example */
module.exports = function customPlugin(pluginOptions) {
  // set plugin defaults
  const defaultOptions = {
    addNewLine: false
  }
  const userOptions = pluginOptions || {}
  const pluginConfig = Object.assign(defaultOptions, userOptions)
  // return the transform function
  return function myCustomTransform ({ content, options }) {
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

## Usage examples

- [Projects using markdown-magic](https://github.com/search?q=path%3A**%2Fpackage.json+%22markdown-magic%22&type=code)
- [Examples in md](https://github.com/search?l=Markdown&o=desc&q=AUTO-GENERATED-CONTENT&s=indexed&type=Code)


## Misc Markdown helpers

- https://github.com/azu/markdown-function

## Prior Art

This was inspired by [Kent C Dodds](https://twitter.com/kentcdodds) and [jfmengels](https://github.com/jfmengels)'s [all contributors cli](https://github.com/jfmengels/all-contributors-cli) project.

## License

[MIT][mit] © [DavidWells][author]

[npm-badge]:https://img.shields.io/npm/v/markdown-magic.svg?style=flat-square
[npm-link]: http://www.npmjs.com/package/markdown-magic
[mit]:      http://opensource.org/licenses/MIT
[author]:   http://github.com/davidwells
