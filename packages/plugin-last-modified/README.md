# @markdown-magic/last-modified

> Add last modified date from git to markdown files - Plugin for markdown-magic

## Install

```bash
npm install @markdown-magic/last-modified
```

## Usage

```js
const markdownMagic = require('markdown-magic')
const lastModified = require('@markdown-magic/last-modified')

const config = {
  transforms: {
    lastModified: lastModified
  }
}

markdownMagic(['**/*.md'], config)
```

## Example

**Input:**
```md
<!-- docs lastModified -->
This will be replaced with the last modified date
<!-- /docs -->
```

**Output:**
```md
<!-- docs lastModified -->
**Last modified:** December 19, 2025
<!-- /docs -->
```

## Options

- `file` (optional): Path to a different file to check modification date for. If not provided, uses the current file being processed
- `format` (optional): Date format string for git log command. Default `%ad`  
- `prefix` (optional): Text to prepend to the output. Default `**Last modified:**`

## Examples

### Custom file
```md
<!-- docs lastModified file="./package.json" -->
**Last modified:** December 19, 2025
<!-- /docs -->
```

### Custom prefix
```md
<!-- docs lastModified prefix="Updated on:" -->
Updated on: December 19, 2025
<!-- /docs -->
```

## How it works

The plugin uses Git to determine the last modification date of a file by running:
```bash
git log -1 --format="%ad" --date=format:"%B %d, %Y" -- "filepath"
```

If Git is not available or the file is not tracked in Git, it falls back to using the file system modification time.

## API

### lastModified(options)

Main plugin function.

**Parameters:**
- `content` (string): The current content of the comment block
- `options` (object): The options passed in from the comment declaration
- `srcPath` (string): The path to the current markdown file being processed

**Returns:** string - Formatted last modified date

### getLastModifiedDate(filePath, options)

Utility function to get the last modified date of a file.

**Parameters:**
- `filePath` (string): Path to the file to check
- `options` (object): Options for git command
  - `format` (string): Date format for git log command

**Returns:** string - Last modified date string

## License

MIT