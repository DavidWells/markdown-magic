# comment-block-replacer

Process files with comment block replacements using markdown-magic transforms.

## Installation

```bash
npm install comment-block-replacer
```

## Usage

The comment block replacer allows you to process files (both from file paths and content strings) with comment block transforms, applying configured transforms to update content within delimited blocks.

### Basic Usage

```javascript
const { processFile } = require('comment-block-replacer')

// Process file content directly
const result = await processFile({
  content: `
<!-- DOCS:START example -->
Some content to transform
<!-- DOCS:END -->
  `,
  dryRun: true,
  transforms: {
    example: (api) => {
      return api.content.toUpperCase()
    }
  }
})

console.log(result.updatedContents)
// Output: Content will be transformed to uppercase
```

### Processing Files from Path

```javascript
const { processFile } = require('comment-block-replacer')

const result = await processFile({
  srcPath: './docs/README.md',
  outputPath: './output/README.md',
  transforms: {
    wordcount: (api) => {
      const words = api.content.trim().split(/\s+/).length
      return `Word count: ${words}`
    }
  }
})
```

### File Processing Options

```javascript
const { processFile } = require('comment-block-replacer')

const result = await processFile({
  srcPath: './src/example.md',
  outputPath: './dist/example.md',
  dryRun: false,                    // Set to true to preview changes without writing
  applyTransformsToSource: true,    // Also update the source file
  syntax: 'md',                     // Override detected syntax
  transforms: {
    uppercase: (api) => api.content.toUpperCase(),
    file: (api) => `Content from ${api.options.src}`
  }
})
```

### Output Directory Configuration

```javascript
const result = await processFile({
  content: 'File content...',
  outputPath: './dist/processed.md',
  output: {
    directory: './dist'    // Output directory
  },
  outputDir: './dist',     // Legacy option (same as output.directory)
  transforms: { /* ... */ }
})
```

### Comment Pattern Stripping

```javascript
const result = await processFile({
  srcPath: './docs/source.md',
  outputPath: './dist/clean.md',
  removeComments: true,
  patterns: {
    openPattern: /<!-- DOCS:START .* -->/g,
    closePattern: /<!-- DOCS:END -->/g
  },
  transforms: { /* ... */ }
})
```

## API Reference

### processFile(options)

Process a file with comment block replacements using configured transforms.

#### Parameters

- `options` (ProcessFileOptions): Processing configuration options

#### Returns

Promise<ProcessFileResult> - Result object with processed content and metadata

### ProcessFileOptions

Configuration object for processing files.

```typescript
interface ProcessFileOptions {
  content?: string                    // File content as string (mutually exclusive with srcPath)
  srcPath?: string                   // Source file path (mutually exclusive with content)  
  syntax?: string                    // File syntax type (e.g., 'md', 'js', 'html')
  outputPath?: string                // Output file path for processed content
  dryRun?: boolean                   // If true, process but don't write files (default: false)
  patterns?: {                       // Comment patterns for stripping
    openPattern?: RegExp             // Opening comment pattern regex
    closePattern?: RegExp            // Closing comment pattern regex
  }
  output?: {                         // Output configuration
    directory?: string               // Output directory path
  }
  outputDir?: string                 // Legacy output directory option
  applyTransformsToSource?: boolean  // Apply transforms to source file (default: false)
  transforms?: object                // Transform functions to apply to blocks
  beforeMiddleware?: Array           // Middleware to run before transforms
  afterMiddleware?: Array            // Middleware to run after transforms
  removeComments?: boolean           // Remove comment blocks from output (default: false)
  open?: string                      // Opening delimiter for comment blocks
  close?: string                     // Closing delimiter for comment blocks
}
```

### ProcessFileResult

Result object returned by processFile:

```typescript
interface ProcessFileResult {
  isChanged: boolean           // Whether the content was modified
  isNewPath: boolean          // Whether srcPath differs from outputPath
  stripComments: boolean      // Whether comments should be stripped from output
  srcPath?: string            // Source file path used
  outputPath?: string         // Output file path used
  transforms: Array           // Array of transforms that were applied
  missingTransforms: Array    // Array of transforms that were not found
  originalContents: string    // Original input content
  updatedContents: string     // Processed output content
}
```

## Transform Function API

Transform functions receive an API object with the following properties:

```typescript
interface TransformApi {
  transform: string              // Name of the transform
  content: string               // Content to transform
  options: object               // Transform options
  srcPath?: string              // Source file path
  outputPath?: string           // Output file path
  settings: object              // Additional settings including regex patterns
  currentContent: string        // Current file contents
  originalContent: string       // Original file contents
  getCurrentContent(): string   // Function to get current file contents
  getOriginalContent(): string  // Function to get original file contents
  getOriginalBlock(): object    // Function to get the original block data
  getBlockDetails(content?: string): object // Function to get detailed block information
}
```

## Examples

### Multiple Transform Types

```javascript
const { processFile } = require('comment-block-replacer')

const result = await processFile({
  srcPath: './docs/api.md',
  transforms: {
    toc: (api) => generateTableOfContents(api.currentContent),
    wordcount: (api) => `Words: ${api.content.trim().split(/\s+/).length}`,
    file: (api) => fs.readFileSync(api.options.src, 'utf8'),
    code: (api) => {
      const code = fs.readFileSync(api.options.src, 'utf8')
      return `\`\`\`${api.options.lang || 'javascript'}\n${code}\n\`\`\``
    }
  }
})
```

### Syntax Detection

The processor automatically detects file syntax from the file extension:

```javascript
// JavaScript files (.js)
await processFile({
  srcPath: './src/example.js',  // Syntax: 'js'
  // Uses // comment blocks by default
})

// Markdown files (.md)
await processFile({
  srcPath: './docs/readme.md',  // Syntax: 'md' 
  // Uses <!-- --> comment blocks by default
})

// Override syntax detection
await processFile({
  srcPath: './config.json',
  syntax: 'js',  // Force JavaScript syntax
})
```

## Error Handling

```javascript
try {
  const result = await processFile({
    srcPath: './docs/file.md',
    content: 'content string', // Error: can't use both
    transforms: {}
  })
} catch (error) {
  console.error('Processing failed:', error.message)
  // "Can't set both "srcPath" & "content""
}
```

## Testing

The package uses [uvu](https://github.com/lukeed/uvu) for testing:

```bash
npm test
```

## TypeScript Support

This package includes TypeScript declarations. The types are automatically generated from JSDoc comments.

```bash
npm run build
```

## License

MIT