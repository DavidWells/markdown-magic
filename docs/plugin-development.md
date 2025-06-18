# Plugin Development Guide

Learn how to create custom transforms (plugins) for markdown-magic to extend its functionality.

## Transform Basics

A transform is a function that takes content and options, then returns processed content:

```js
// Basic transform structure
function myTransform(content, options, config) {
  // Process the content
  return processedContent
}
```

### Parameters

- `content`: The content between the comment blocks
- `options`: Parsed options from the comment block
- `config`: Global markdown-magic configuration

## Creating Your First Transform

### Simple String Transform

```js
// transforms/greeting.js
module.exports = function greeting(content, options) {
  const name = options.name || 'World'
  return `Hello, ${name}!`
}
```

Usage:
```md
<!-- doc-gen greeting name='Alice' -->
<!-- end-doc-gen -->
```

Result: `Hello, Alice!`

### File-Based Transform

```js
// transforms/include.js
const fs = require('fs')
const path = require('path')

module.exports = function include(content, options) {
  if (!options.src) {
    throw new Error('include transform requires "src" option')
  }
  
  const filePath = path.resolve(options.src)
  
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`)
    return content // Keep existing content
  }
  
  return fs.readFileSync(filePath, 'utf8')
}
```

Usage:
```md
<!-- doc-gen include src='./snippets/example.md' -->
<!-- end-doc-gen -->
```

## Async Transforms

For operations that require network requests or file system operations:

```js
// transforms/fetchContent.js
const fetch = require('node-fetch')

module.exports = async function fetchContent(content, options) {
  if (!options.url) {
    throw new Error('fetchContent requires "url" option')
  }
  
  try {
    const response = await fetch(options.url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error(`Failed to fetch ${options.url}:`, error.message)
    return content // Fallback to existing content
  }
}
```

## Advanced Transform Patterns

### Transform with Template Processing

```js
// transforms/template.js
const mustache = require('mustache')

module.exports = function template(content, options) {
  const template = options.template || content
  const data = {
    ...options.data,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  }
  
  return mustache.render(template, data)
}
```

### Code Processing Transform

```js
// transforms/codeStats.js
const fs = require('fs')

module.exports = function codeStats(content, options) {
  if (!options.src) {
    throw new Error('codeStats requires "src" option')
  }
  
  const code = fs.readFileSync(options.src, 'utf8')
  const lines = code.split('\n')
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)
  
  return `
## Code Statistics for ${options.src}

- Total lines: ${lines.length}
- Non-empty lines: ${nonEmptyLines.length}
- File size: ${Buffer.byteLength(code, 'utf8')} bytes
  `.trim()
}
```

### Multi-Format Transform

```js
// transforms/tableOfContents.js
module.exports = function tableOfContents(content, options) {
  const format = options.format || 'markdown'
  const maxDepth = parseInt(options.maxDepth) || 3
  const minDepth = parseInt(options.minDepth) || 1
  
  // Extract headings from content
  const headings = extractHeadings(content, minDepth, maxDepth)
  
  switch (format) {
    case 'markdown':
      return generateMarkdownTOC(headings)
    case 'html':
      return generateHTMLTOC(headings)
    case 'json':
      return JSON.stringify(headings, null, 2)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

function extractHeadings(content, minDepth, maxDepth) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings = []
  let match
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    if (level >= minDepth && level <= maxDepth) {
      headings.push({
        level,
        text: match[2].trim(),
        anchor: match[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      })
    }
  }
  
  return headings
}
```

## Registering Transforms

### In Configuration File

```js
// markdown.config.js
const greeting = require('./transforms/greeting')
const include = require('./transforms/include')

module.exports = {
  transforms: {
    greeting,
    include,
    // Inline transform
    timestamp: () => new Date().toISOString()
  }
}
```

### Programmatically

```js
import markdownMagic from 'markdown-magic'

const config = {
  transforms: {
    myTransform: (content, options) => {
      return `Processed: ${content}`
    }
  }
}

markdownMagic('./docs/*.md', config)
```

## Transform Options

### Option Parsing

Markdown-magic automatically parses options from the comment block:

```md
<!-- doc-gen myTransform 
  stringOption='value'
  numberOption=42
  boolOption=true
  arrayOption=['a', 'b', 'c']
  objectOption='{"key": "value"}'
-->
```

Access in transform:
```js
module.exports = function myTransform(content, options) {
  console.log(options.stringOption) // 'value'
  console.log(options.numberOption) // 42
  console.log(options.boolOption)   // true
  console.log(options.arrayOption)  // ['a', 'b', 'c']
  console.log(JSON.parse(options.objectOption)) // {key: 'value'}
}
```

### Default Options

```js
module.exports = function myTransform(content, options) {
  const defaults = {
    format: 'markdown',
    includeTitle: true,
    maxItems: 10
  }
  
  const config = { ...defaults, ...options }
  
  // Use config.format, config.includeTitle, etc.
}
```

## Error Handling

### Validation

```js
module.exports = function strictTransform(content, options) {
  // Required options
  const required = ['url', 'format']
  for (const opt of required) {
    if (!options[opt]) {
      throw new Error(`Missing required option: ${opt}`)
    }
  }
  
  // Format validation
  const validFormats = ['json', 'yaml', 'xml']
  if (!validFormats.includes(options.format)) {
    throw new Error(`Invalid format: ${options.format}. Must be one of: ${validFormats.join(', ')}`)
  }
  
  // Process with validated options
}
```

### Graceful Degradation

```js
module.exports = async function robustTransform(content, options) {
  try {
    // Attempt primary operation
    return await primaryOperation(options)
  } catch (error) {
    console.warn(`Primary operation failed: ${error.message}`)
    
    try {
      // Attempt fallback operation
      return await fallbackOperation(options)
    } catch (fallbackError) {
      console.error(`Fallback also failed: ${fallbackError.message}`)
      // Return original content as last resort
      return content
    }
  }
}
```

## Testing Transforms

### Unit Tests

```js
// transforms/__tests__/greeting.test.js
const greeting = require('../greeting')

describe('greeting transform', () => {
  it('should greet with provided name', () => {
    const result = greeting('', { name: 'Alice' })
    expect(result).toBe('Hello, Alice!')
  })
  
  it('should use default name when none provided', () => {
    const result = greeting('', {})
    expect(result).toBe('Hello, World!')
  })
  
  it('should handle special characters in name', () => {
    const result = greeting('', { name: 'José' })
    expect(result).toBe('Hello, José!')
  })
})
```

### Integration Tests

```js
// transforms/__tests__/integration.test.js
const markdownMagic = require('markdown-magic')
const fs = require('fs')
const path = require('path')

describe('transform integration', () => {
  const testFile = path.join(__dirname, 'fixtures/test.md')
  
  beforeEach(() => {
    // Reset test file
    fs.writeFileSync(testFile, `
<!-- doc-gen greeting name='Test' -->
<!-- end-doc-gen -->
    `.trim())
  })
  
  it('should process transform correctly', async () => {
    await markdownMagic(testFile, {
      transforms: {
        greeting: require('../greeting')
      }
    })
    
    const result = fs.readFileSync(testFile, 'utf8')
    expect(result).toContain('Hello, Test!')
  })
})
```

## Publishing Transforms

### NPM Package Structure

```
my-markdown-magic-plugin/
├── package.json
├── README.md
├── index.js
├── transforms/
│   ├── transform1.js
│   └── transform2.js
└── __tests__/
    └── transforms.test.js
```

### Package.json

```json
{
  "name": "markdown-magic-my-plugin",
  "version": "1.0.0",
  "description": "Custom transforms for markdown-magic",
  "main": "index.js",
  "keywords": ["markdown-magic", "transform", "plugin"],
  "peerDependencies": {
    "markdown-magic": "^1.0.0"
  }
}
```

### Main Export

```js
// index.js
module.exports = {
  transforms: {
    myTransform: require('./transforms/my-transform'),
    anotherTransform: require('./transforms/another-transform')
  }
}
```

### Usage by Others

```js
// User's config
const myPlugin = require('markdown-magic-my-plugin')

module.exports = {
  transforms: {
    ...myPlugin.transforms,
    // User's custom transforms
  }
}
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Validation**: Validate inputs and provide helpful error messages
3. **Documentation**: Document options and usage examples
4. **Testing**: Write comprehensive tests
5. **Performance**: Cache expensive operations when possible
6. **Naming**: Use descriptive transform names
7. **Consistency**: Follow consistent patterns across transforms
8. **Backward Compatibility**: Consider version compatibility when updating

## Transform Examples Repository

Check out the [examples directory](../examples/) for more real-world transform examples and usage patterns.