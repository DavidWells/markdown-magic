---
title: Advanced Usage
description: Advanced patterns and techniques for complex markdown-magic scenarios, including performance optimization, error handling, and debugging
---

# Advanced Usage

This guide covers advanced patterns and techniques for using markdown-magic effectively in complex scenarios.

## Complex Transform Combinations

### Chaining Transforms

You can use multiple transform blocks in sequence to build complex documentation:

```md
<!-- docs code src=./src/example.js -->
<!-- /docs -->

<!-- docs toc -->
<!-- /docs -->

<!-- docs remote url=https://api.github.com/repos/owner/repo -->
<!-- /docs -->
```

### Conditional Processing

Use custom transforms to conditionally include content:

```js
// In your config file
module.exports = {
  transforms: {
    conditional: ({ content, options }) => {
      if (process.env.NODE_ENV === options.env) {
        return options.content || content
      }
      return '' // Hide content if condition not met
    }
  }
}
```

```md
<!-- docs conditional env='development' content='Development-only content' -->
<!-- /docs -->
```

## Error Handling

### Graceful Degradation

Handle errors gracefully in your transforms:

```js
// Custom transform with error handling
module.exports = {
  transforms: {
    safeRemote: async ({ content, options }) => {
      try {
        const response = await fetch(options.url)
        return await response.text()
      } catch (error) {
        console.warn(`Failed to fetch ${options.url}:`, error.message)
        return content // Keep existing content on error
      }
    }
  }
}
```

### Validation

Validate transform options before processing:

```js
const validateOptions = (options, required) => {
  for (const field of required) {
    if (!options[field]) {
      throw new Error(`Missing required option: ${field}`)
    }
  }
}

module.exports = {
  transforms: {
    strictRemote: ({ content, options }) => {
      validateOptions(options, ['url'])
      // ... rest of transform logic
    }
  }
}
```

## Performance Optimization

### Caching

Implement caching for expensive operations:

```js
const cache = new Map()

module.exports = {
  transforms: {
    cachedRemote: async ({ content, options }) => {
      const cacheKey = `remote:${options.url}`
      
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)
      }
      
      const response = await fetch(options.url)
      const result = await response.text()
      
      cache.set(cacheKey, result)
      return result
    }
  }
}
```

### Parallel Processing

Process multiple files concurrently:

```js
import markdownMagic from 'markdown-magic'
import glob from 'glob'

const files = glob.sync('**/*.md')
const promises = files.map(file => markdownMagic(file))

Promise.all(promises).then(results => {
  console.log(`Processed ${results.length} files`)
})
```

## Complex Configuration

### Environment-Specific Configs

```js
// md.config.js
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  matchWord: 'docs',
  outputDir: isDev ? './docs-dev' : './docs',
  transforms: {
    // Environment-specific transforms
    ...(isDev && {
      debug: ({ content, options }) => {
        console.log('Debug transform:', options)
        return content
      }
    })
  }
}
```

### Multiple Configurations

Use different configs for different file types:

```js
// Process different file types with different configs
import markdownMagic from 'markdown-magic'

// Config for documentation
const docsConfig = {
  matchWord: 'docs',
  transforms: { /* docs-specific transforms */ }
}

// Config for README files
const readmeConfig = {
  matchWord: 'readme-gen',
  transforms: { /* readme-specific transforms */ }
}

// Apply different configs
markdownMagic('./docs/**/*.md', docsConfig)
markdownMagic('./README.md', readmeConfig)
```

## Advanced Transform Patterns

### Dynamic Content Generation

```js
module.exports = {
  transforms: {
    packageInfo: ({ content, options }) => {
      const pkg = require('./package.json')
      
      return `
## ${pkg.name} v${pkg.version}

${pkg.description}

### Installation
\`\`\`bash
npm install ${pkg.name}
\`\`\`

### Dependencies
${Object.keys(pkg.dependencies || {}).map(dep => `- ${dep}`).join('\n')}
      `.trim()
    }
  }
}
```

### Template Processing

```js
const mustache = require('mustache')

module.exports = {
  transforms: {
    template: ({ content, options }) => {
      const template = options.template || content
      const data = options.data || {}
      
      return mustache.render(template, data)
    }
  }
}
```

Usage:
```md
<!-- docs template data='{"name": "John", "role": "Developer"}' -->
Hello {{name}}, you are a {{role}}!
<!-- /docs -->
```

## Testing Custom Transforms

### Unit Testing

```js
// transform.test.js
const { myTransform } = require('./transforms')

describe('myTransform', () => {
  it('should process content correctly', () => {
    const content = 'original'
    const options = { param: 'value' }
    const result = myTransform({ content, options })
    
    expect(result).toBe('expected output')
  })
  
  it('should handle errors gracefully', () => {
    expect(() => {
      myTransform('content', {}) // missing required options
    }).toThrow('Missing required option')
  })
})
```

### Integration Testing

```js
// integration.test.js
import markdownMagic from 'markdown-magic'
import fs from 'fs'

describe('markdown processing', () => {
  it('should process test files correctly', async () => {
    const testFile = './test-fixtures/sample.md'
    const config = { transforms: { /* test config */ } }
    
    await markdownMagic(testFile, config)
    
    const result = fs.readFileSync(testFile, 'utf8')
    expect(result).toContain('expected content')
  })
})
```

## Debugging

### Debug Mode

Enable debug logging:

```js
// Set environment variable
process.env.DEBUG = 'markdown-magic:*'

// Or use debug in transforms
const debug = require('debug')('markdown-magic:custom')

module.exports = {
  transforms: {
    debugTransform: ({ content, options }) => {
      debug('Processing with options:', options)
      // ... transform logic
      debug('Result:', result)
      return result
    }
  }
}
```

### Troubleshooting Common Issues

1. **Transform not executing**: Check transform name spelling and registration
2. **Options not passed**: Verify option syntax and quoting
3. **Async issues**: Ensure async transforms return promises
4. **File encoding**: Check file encoding if special characters appear corrupted

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Performance**: Cache expensive operations
3. **Testing**: Write tests for custom transforms
4. **Documentation**: Document custom transforms and options
5. **Validation**: Validate inputs before processing
6. **Modularity**: Keep transforms focused and reusable