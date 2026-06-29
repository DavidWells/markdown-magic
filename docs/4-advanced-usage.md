---
title: Advanced Usage
description: Advanced patterns and techniques for complex markdown-magic scenarios, including performance optimization, error handling, and debugging
---

# Advanced Usage

This guide covers advanced patterns and techniques for using markdown-magic effectively in complex scenarios.

## Complex Transform Combinations

### Sync Selected README Sections

Use `sections` when you want to include only specific README sections:

```md
<!-- docs REMOTE
  src="https://raw.githubusercontent.com/DavidWells/example/master/README.md"
  sections="Installation,Usage,API"
  removeLeadingH1
  shiftHeaders=1
-->
<!-- /docs -->
```

Use `headings` when you want to include every section at specific heading levels:

```md
<!-- docs FILE
  src="./README.md"
  headings={[2,3]}
  removeLeadingH1
  shiftHeaders=1
-->
<!-- /docs -->
```

`sections` matches normalized heading text. `headings={[2,3]}` includes all H2 and H3 sections without duplicating nested sections that are already part of a selected parent.

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

GitHub file URLs can point at `blob` or `raw.githubusercontent.com` paths. Public files are fetched anonymously by default. Private files require an explicit run-level opt-in before Markdown Magic will use `GITHUB_ACCESS_TOKEN`, `GITHUB_TOKEN`, `githubToken`, or local `gh` authentication:

```md
<!-- docs remote
  src='https://github.com/owner/private-repo/blob/main/README.md'
  removeLeadingH1
-->
<!-- /docs -->
```

Set `MARKDOWN_MAGIC_GH_CLI=0` if CI should never fall back to `gh api`.

Enable private GitHub reads in config:

```js
module.exports = {
  allowPrivateGithub: true
}
```

Or enable them for one CLI run:

```bash
md-magic --allow-private-github --files README.md
```

### Remote Cache

`REMOTE` and remote `CODE` fetches use a small local cache by default. The cache is outside your project directory in the current user's OS cache location, such as `~/Library/Caches/markdown-magic/remote-cache-v1` on macOS, `$XDG_CACHE_HOME/markdown-magic/remote-cache-v1` on Linux when set, or `~/.cache/markdown-magic/remote-cache-v1` otherwise.

Normal remote responses are reused for 5 minutes. GitHub file URLs pinned to a full 40-character commit SHA are treated as immutable and use a longer 30-day TTL. Branch names, tags, and short SHAs use the normal TTL because they can move.

```js
module.exports = {
  remoteCache: {
    ttl: 5 * 60 * 1000,
    immutableTtl: 30 * 24 * 60 * 60 * 1000,
    directory: '.cache/markdown-magic-remote'
  }
}
```

Disable the cache for a run with either form:

```js
module.exports = {
  remoteCache: false
  // or remoteCache: { enabled: false }
}
```

Or disable it for one CLI run:

```bash
md-magic --no-cache --files README.md
# alias: md-magic --no-remote-cache --files README.md
```

Private GitHub reads and caching are separate controls. `allowPrivateGithub: true` opts into resolving private repository content. `remoteCache.cachePrivate` controls whether authenticated private responses are persisted to disk:

```js
module.exports = {
  allowPrivateGithub: true,
  remoteCache: {
    cachePrivate: false
  }
}
```

With `cachePrivate: false`, duplicate private requests are still reused in memory during the current process, but private response bodies are not written to the cache directory. When both private GitHub reads and private caching are enabled, private fetched content can persist in the local cache until it expires or is manually removed. Do not put token values in markdown files; use environment variables or an authenticated `gh` session for trusted runs.

Remote requests are logged as they happen. Cache hits keep the same shape and are marked explicitly:

```text
🌐   Getting remote (from cache):
  https://raw.githubusercontent.com/owner/repo/main/README.md
```

Set `logRemoteRequests: false` to suppress remote request and cache-hit logs, or `remoteCache: { logHits: false }` to keep network request logs while hiding cache-hit logs.

To clear the default cache, remove the `markdown-magic/remote-cache-v1` directory from your OS cache location. To clear a custom cache, remove the directory configured in `remoteCache.directory`.

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
