# Comment Block Parser

A standalone block parser for parsing comment blocks in markdown and other file types. Extracted from [markdown-magic](https://github.com/DavidWells/markdown-magic).

## Installation

```bash
npm install comment-block-parser
```

## CLI

Parse comment blocks from the command line.

```bash
# Parse file (syntax auto-detected from extension)
comment-block-parser ./file.md
comment-block-parser ./src/index.js

# Parse with custom open/close words
comment-block-parser auto ./file.md                    # open=auto, close=/auto
comment-block-parser --open docs --close /docs ./file.md

# Pattern mode (--open without --close)
comment-block-parser --open MyComponent --syntax js ./file.js
comment-block-parser --open "CompA|CompB" --syntax js ./file.js

# Parse from stdin
cat file.md | comment-block-parser
echo "<!-- block foo -->content<!-- /block -->" | comment-block-parser

# Extract specific data with jq
cat file.md | comment-block-parser | jq '.blocks[0].options'
```

### CLI Options

```
--open             Opening pattern (literal word or regex pattern, default: block)
--close            Closing pattern (if omitted with regex open, uses /name backreference)
--no-close         Match single comments only (no close tag required)
--syntax           Comment syntax: md, js, jsx, yaml, sql, toml (auto-detected from file)
--parseType        Treat first arg after open keyword as transform type
--help, -h         Show help
--version, -v      Show version
```

## Example

The library works with a variety of [syntaxes](#supported-syntaxes).

As an example, it matches `html` comments like this

```html
<!-- matchWord blockType [...args] -->
contents inside
<!-- closeMatchWord -->
```

and returns

```js
{
  type: 'blockType',
  options: { ...parsedArgs },
  openValue: "<-- matchWord type [...args] -->",
  contentValue: 'contents inside',
  closeValue: '<!--/docs-->',
  rawArgs: "[...args]",
  blockValue: "<-- closeMatchWord -->"
}
```

## Usage

```js
const { parseBlocks, getBlockRegex } = require('comment-block-parser')

// Parse markdown comment blocks
const content = `
<!-- docs inlineExample foo={{ rad: 'bar' }}-->99<!--/docs-->

<!-- docs fooBar isCool -->
Stuff inside the block
<!--/docs-->
`

const result = parseBlocks(content, {
  open: 'docs',
  close: '/docs'
})

console.log(result.blocks)
/*
// Result
[
  {
    index: 1,
    type: 'inlineExample',
    options: { foo: { rad: 'bar' } },
    openValue: "<!-- docs inlineExample foo={{ rad: 'bar' }}-->",
    contentValue: '99',
    closeValue: '<!--/docs-->',
    rawArgs: "foo={{ rad: 'bar' }}",
    rawContent: '99',
    blockValue: "<!-- docs inlineExample foo={{ rad: 'bar' }}-->99<!--/docs-->"
  },
  {
    index: 2,
    type: 'fooBar',
    options: { isCool: true },
    openValue: '<!-- docs fooBar isCool -->\n',
    contentValue: 'Stuff inside the block',
    closeValue: '\n<!--/docs-->',
    rawArgs: 'isCool',
    rawContent: 'Stuff inside the block',
    blockValue: '<!-- docs fooBar isCool -->\nStuff inside the block\n<!--/docs-->'
  }
]
*/
```

## API

### `parseBlocks(content, options)`

Parse comment blocks from content string.

**Parameters:**
- `content` (string) - The content to parse
- `options` (object) - Parser options
  - `open` (string) - Opening word or regex pattern (default: 'block')
  - `close` (string) - Closing word or pattern. If omitted and `open` is regex-like or differs from default, uses pattern mode with backreference
  - `syntax` (string) - File syntax type (default: 'md')
  - `firstArgIsType` (boolean) - Treat first arg after open word as transform type (default: false)

**Returns:** Object with parsed blocks and regex patterns

### `getBlockRegex(options)`

Get regex patterns for matching blocks.

**Parameters:**
- `options` (object) - Regex options
  - `syntax` (string) - File syntax type
  - `openText` (string) - Opening delimiter text
  - `closeText` (string) - Closing delimiter text
  - `allowMissingTransforms` (boolean) - Allow missing transform keys

**Returns:** Object with `blockPattern`, `openPattern`, and `closePattern` regex objects

## Pattern Mode

Pattern mode allows matching component-style blocks where the open tag name is dynamic and the close tag must match via backreference.

**When pattern mode activates:**
1. `open` contains regex chars (`|`, `[`, `*`, `+`, etc.)
2. `close` not provided AND `open` differs from default 'block'

### Single Component

```js
const content = `/* MyComponent name="test" */
widget content here
/* /MyComponent */`

const result = parseBlocks(content, {
  syntax: 'js',
  open: 'MyComponent',  // no close = pattern mode
})

// result.blocks[0].type === 'MyComponent'
// result.blocks[0].options === { name: 'test' }
```

### Multiple Components (OR pattern)

```js
const content = `/* Header title="Hello" */
header content
/* /Header */

/* Footer year="2024" */
footer content
/* /Footer */`

const result = parseBlocks(content, {
  syntax: 'js',
  open: 'Header|Footer',  // matches either
})

// result.blocks[0].type === 'Header'
// result.blocks[1].type === 'Footer'
```

### Wildcard Patterns

```js
const content = `/* Gen_Users enabled -->
user list
/* /Gen_Users */

/* Gen_Products disabled */
product list
/* /Gen_Products */`

const result = parseBlocks(content, {
  syntax: 'js',
  open: 'Gen_[A-Za-z]+',
})

// Matches Gen_Users, Gen_Products, Gen_Anything, etc.
```

### Backreference Enforcement

Close tags must match the open tag exactly:

```js
/* ComponentA */
content
/* /ComponentB */  // DOES NOT MATCH - close doesn't match open
```

### Explicit Open and Close Patterns

When both `open` and `close` are provided as patterns:

```js
const result = parseBlocks(content, {
  syntax: 'js',
  open: 'START_[A-Z]',
  close: 'END_[A-Z]',
})
// Matches START_A...END_A, START_B...END_B, etc.
```

### RegExp Objects and Regex Literals

The `open` option accepts RegExp objects directly or regex literal strings (`/pattern/flags`):

```js
// RegExp object
const result = parseBlocks(content, {
  syntax: 'js',
  open: /CompA|CompB/,
})

// Regex literal string
const result = parseBlocks(content, {
  syntax: 'js',
  open: '/CompA|CompB/',
})

// With flags (parsed but flags not applied to block matching)
const result = parseBlocks(content, {
  syntax: 'js',
  open: '/Widget/i',
})
```

### CLI Pattern Mode

```bash
# Single component
comment-block-parser --open MyComponent --syntax js ./file.js

# OR pattern
comment-block-parser --open "CompA|CompB" --syntax js ./file.js

# Wildcard
comment-block-parser --open "Gen_[A-Za-z]+" --syntax js ./file.js

# Regex literal string
comment-block-parser --open "/CompA|CompB/" --syntax js ./file.js
```

## Single Comment Mode

Single comment mode matches individual comments without requiring a close tag. Use `close: false` to enable this mode.

```js
const content = `
<!-- config debug=true -->
some content here
<!-- config env="prod" -->
more content
`

const result = parseBlocks(content, {
  syntax: 'md',
  open: 'config',
  close: false  // single comment mode
})

// result.blocks.length === 2
// result.blocks[0].options === { debug: true }
// result.blocks[1].options === { env: 'prod' }
```

### With Pattern Matching

```js
const result = parseBlocks(content, {
  syntax: 'md',
  open: 'header|footer',  // match multiple comment types
  close: false
})
```

### CLI Single Comment Mode

```bash
# Match single comments with --no-close
comment-block-parser --no-close --open config ./file.md

# With match word
comment-block-parser --no-close widget ./file.md

# With pattern
comment-block-parser --no-close --open "header|footer" ./file.md
```

## Supported Syntaxes

- `md` / `markdown` / `html` - HTML comments (`<!-- -->`)
- `js` / `json` - JavaScript comments (`/* */`)
- `jsx` / `mdx` - JSX comments (`{/* */}`)
- `yml` / `yaml` - YAML comments (`##`)
- `sql` - SQL comments (`/* */` and `--`)
- `toml` - TOML comments (`#`)

## License

MIT