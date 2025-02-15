
## Install

To get started. Install the npm package.

```bash
npm install markdown-magic --save-dev
```

## Usage

Use comment blocks in your markdown

**Example:**
```md
<!-- doc-gen remote url=http://url-to-raw-md-file.md -->
This content will be dynamically replaced from the remote url
<!-- end-doc-gen -->
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
md-magic --path '**/*.md' --config ./config.file.js
```

In NPM scripts, `npm run docs` would run the markdown magic and parse all the `.md` files in the directory.

```json
"scripts": {
  "docs": "md-magic --path '**/*.md'"
},
```

If you have a `markdown.config.js` file where `markdown-magic` is invoked, it will automatically use that as the configuration unless otherwise specified by `--config` flag.

### Running programmatically

<!-- ⛔️ MD-MAGIC-EXAMPLE:START CODE src=../examples/0_zero-config.js -->
```js
const { markdownMagic } = require('../lib')

/* By default all .md files in cwd will be processed */
markdownMagic().then((results) => {
  console.log('result keys', Object.keys(results))
})
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START CODE src=../examples/1-_basic-usage.js -->
```js
import path from 'path'
import markdownMagic from 'markdown-magic'

// Process a Single File
const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->