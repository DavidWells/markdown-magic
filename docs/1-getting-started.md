# Getting Started

## Installation

Install markdown-magic as a development dependency:

```bash
npm install markdown-magic --save-dev
```

## Quick Start

Add comment blocks to your markdown files to define where content should be generated:

```md
<!-- doc-gen remote url=http://url-to-raw-md-file.md -->
This content will be dynamically replaced from the remote url
<!-- end-doc-gen -->
```

Then run markdown-magic to process your files.

## CLI Usage

Run `markdown --help` to see all available CLI options:

```bash
markdown
# or
md-magic
```

### CLI Examples

Process all markdown files in current directory:
```bash
md-magic
```

Process specific files with custom config:
```bash
md-magic --path '**/*.md' --config ./config.file.js
```

### NPM Scripts Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "docs": "md-magic --path '**/*.md'"
  }
}
```

Run with: `npm run docs`

### Configuration File

Create a `markdown.config.js` file in your project root for automatic configuration:

```js
module.exports = {
  matchWord: 'doc-gen',
  transforms: {
    // your custom transforms
  }
}
```

## Programmatic Usage

### Zero Configuration

<!-- ⛔️ MD-MAGIC-EXAMPLE:START CODE src=../examples/0_zero-config.js -->
```js
const { markdownMagic } = require('../src')

/* By default all .md files in cwd will be processed */
markdownMagic().then((results) => {
  console.log('result keys', Object.keys(results))
})
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

### Basic Usage

<!-- ⛔️ MD-MAGIC-EXAMPLE:START CODE src=../examples/1-_basic-usage.js -->
```js
import path from 'path'
import markdownMagic from 'markdown-magic'

// Process a Single File
const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
```
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

## Next Steps

- Check out the [Syntax Reference](./syntax-reference.md) for all available syntax options
- Learn about [Advanced Usage](./advanced-usage.md) patterns
- Explore [Plugin Development](./plugin-development.md) to create custom transforms