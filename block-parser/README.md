# Markdown Magic Block Parser

A standalone block parser for parsing comment blocks in markdown and other file types. Extracted from [markdown-magic](https://github.com/DavidWells/markdown-magic).

## Installation

```bash
npm install markdown-magic-block-parser
```

## Usage

```javascript
const { parseBlocks, getBlockRegex } = require('markdown-magic-block-parser')

// Parse markdown comment blocks
const content = `
<!-- DOCS:START(toc) -->
<!-- DOCS:END -->
`

const result = parseBlocks(content, {
  open: 'DOCS:START',
  close: 'DOCS:END',
  syntax: 'md'
})

console.log(result.blocks)
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