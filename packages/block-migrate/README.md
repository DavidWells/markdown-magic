# comment-block-migrate

Migration utility for markdown-magic - Migrate markdown files with find-and-replace transformations.

## Installation

```bash
npm install comment-block-migrate
```

## Usage

### Basic Migration

```javascript
const { migrateMarkdownFiles } = require('comment-block-migrate');

await migrateMarkdownFiles({
  replacements: [
    { find: /<!--\s*doc-gen/g, replace: '<!-- docs' },
    { find: /<!--\s*end-doc-gen/g, replace: '<!-- /docs' }
  ]
});
```

### Dry Run Mode

Preview what would change without modifying files:

```javascript
await migrateMarkdownFiles({
  pattern: 'docs/**/*.md',
  replacements: [
    { find: 'old-word', replace: 'new-word' }
  ],
  dryRun: true
});
```

### Migrate from doc-gen to docs

Convenience function for the common doc-gen → docs migration:

```javascript
const { migrateDocGenToDocs } = require('comment-block-migrate');

await migrateDocGenToDocs();
```

## API

### `migrateMarkdownFiles(options)`

Migrate markdown files by applying find-and-replace transformations.

#### Options

- `pattern` (string): Glob pattern for files to migrate. Default: `**/*.md`
- `cwd` (string): Current working directory. Default: `process.cwd()`
- `ignore` (string[]): Patterns to ignore. Default: `['**/node_modules/**']`
- `replacements` (Array): Array of replacement rules with `find` and `replace` properties
- `verbose` (boolean): Whether to log progress. Default: `true`
- `dryRun` (boolean): If true, don't write files, just report what would change. Default: `false`

#### Returns

Promise that resolves to:
- `filesProcessed` (number): Total files found
- `filesUpdated` (number): Number of files that were modified
- `updatedFiles` (string[]): Array of file paths that were updated

### `migrateDocGenToDocs(options)`

Convenience function for migrating from doc-gen to docs syntax. Accepts the same options as `migrateMarkdownFiles`.

## Examples

### Custom Replacements

```javascript
await migrateMarkdownFiles({
  pattern: 'docs/**/*.md',
  replacements: [
    { find: /OLD_SYNTAX/g, replace: 'NEW_SYNTAX' },
    { find: 'foo', replace: 'bar' }
  ],
  verbose: true
});
```

### Multiple Patterns

```javascript
// Migrate specific directories
await migrateMarkdownFiles({
  pattern: '{docs,examples}/**/*.md',
  replacements: [
    { find: /old-pattern/g, replace: 'new-pattern' }
  ]
});
```

## License

MIT © [David Wells](https://github.com/DavidWells)
