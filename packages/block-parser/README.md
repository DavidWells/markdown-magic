# Comment Block Parser

A standalone block parser for parsing comment blocks in markdown and other file types. Extracted from [markdown-magic](https://github.com/DavidWells/markdown-magic).

## Installation

```bash
npm install comment-block-parser
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
  - `open` (string) - Opening delimiter (default: 'doc-gen')
  - `close` (string) - Closing delimiter (default: 'end-doc-gen')
  - `syntax` (string) - File syntax type (default: 'md')

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

## Supported Syntaxes

- `md` / `markdown` / `html` - HTML comments (`<!-- -->`)
- `js` / `json` - JavaScript comments (`/* */`)
- `jsx` / `mdx` - JSX comments (`{/* */}`)
- `yml` / `yaml` - YAML comments (`##`)
- `sql` - SQL comments (`/* */` and `--`)
- `toml` - TOML comments (`#`)

## License

MIT