# comment-block-transformer

Transform markdown blocks based on configured transforms with middleware support.

## Installation

```bash
npm install comment-block-transformer
```

## Usage

The block transformer allows you to process markdown blocks with custom transforms and middleware functions.

### Basic Usage

```javascript
const { blockTransformer } = require('comment-block-transformer')

const text = `
<!-- DOCS:START example -->
Some content to transform
<!-- DOCS:END -->
`

const config = {
  transforms: {
    example: (api) => {
      return api.content.toUpperCase()
    }
  }
}

const result = await blockTransformer(text, config)
console.log(result.updatedContents)
// Output: Content will be transformed to uppercase
```

### Multiple Transforms

You can use multiple transforms in the same document:

```javascript
const text = `
<!-- DOCS:START upperCase -->
hello world
<!-- DOCS:END -->

<!-- DOCS:START reverse -->
abc def
<!-- DOCS:END -->
`

const config = {
  transforms: {
    upperCase: (api) => api.content.toUpperCase(),
    reverse: (api) => api.content.split('').reverse().join('')
  }
}

const result = await blockTransformer(text, config)
```

### Middleware Support

The block transformer supports both `beforeMiddleware` and `afterMiddleware` to process content before and after transforms are applied.

#### Before Middleware

```javascript
const beforeMiddleware = [
  {
    name: 'addPrefix',
    transform: (blockData) => {
      return `PREFIX: ${blockData.content.value}`
    }
  },
  {
    name: 'upperCase',
    transform: (blockData) => {
      return blockData.content.value.toUpperCase()
    }
  }
]

const config = {
  transforms: {
    example: (api) => api.content
  },
  beforeMiddleware
}
```

#### After Middleware

```javascript
const afterMiddleware = [
  {
    name: 'addSuffix',
    transform: (blockData) => {
      return `${blockData.content.value} - PROCESSED`
    }
  }
]

const config = {
  transforms: {
    example: (api) => api.content.trim()
  },
  afterMiddleware
}
```

#### Combined Middleware

You can use both before and after middleware together:

```javascript
const config = {
  transforms: {
    example: (api) => `_${api.content.toUpperCase()}_`
  },
  beforeMiddleware: [
    {
      name: 'addBefore',
      transform: (blockData) => `BEFORE_${blockData.content.value}`
    }
  ],
  afterMiddleware: [
    {
      name: 'addAfter',
      transform: (blockData) => `${blockData.content.value}_AFTER`
    }
  ]
}
```

### Custom Delimiters

You can customize the block delimiters:

```javascript
const text = `
<!-- CUSTOM:START test -->
Some content
<!-- CUSTOM:END -->
`

const config = {
  open: 'CUSTOM:START',
  close: 'CUSTOM:END',
  transforms: {
    test: (api) => api.content.toUpperCase()
  }
}
```

## API Reference

### blockTransformer(inputText, config)

Transform markdown blocks based on configured transforms.

#### Parameters

- `inputText` (string): The text content to process
- `config` (ProcessContentConfig): Configuration options

#### Returns

Promise<BlockTransformerResult> - Result object containing transformed content and metadata

### ProcessContentConfig

Configuration object for processing contents.

```typescript
interface ProcessContentConfig {
  open?: string                    // Opening delimiter (default: 'DOCS:START')
  close?: string                   // Closing delimiter (default: 'DOCS:END')
  syntax?: string                  // Syntax type (default: 'md')
  transforms?: TransformerPlugins  // Transform functions
  beforeMiddleware?: Middleware[]  // Middleware functions applied before transforms
  afterMiddleware?: Middleware[]   // Middleware functions applied after transforms
  removeComments?: boolean         // Remove comments from output (default: false)
  srcPath?: string                 // Source file path
  outputPath?: string              // Output file path
}
```

### TransformFunction

Transform function signature:

```typescript
type TransformFunction = (api: TransformApi) => Promise<string> | string
```

### TransformApi

The API object passed to transform functions:

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

### Middleware

Middleware function interface:

```typescript
interface Middleware {
  name: string                                                    // Name of the middleware
  transform: (blockData: BlockData, updatedText: string) => Promise<string> | string // Transform function
}
```

### BlockTransformerResult

Result object returned by blockTransformer:

```typescript
interface BlockTransformerResult {
  isChanged: boolean           // Whether the content was changed by transforms
  isNewPath: boolean          // Whether srcPath differs from outputPath
  stripComments: boolean      // Whether to strip comments from output
  srcPath?: string            // Source file path
  outputPath?: string         // Output file path
  transforms: BlockData[]     // Array of transforms that were applied
  missingTransforms: any[]    // Array of transforms that were not found
  originalContents: string    // Original input text
  updatedContents: string     // Transformed output text
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