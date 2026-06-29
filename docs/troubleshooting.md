---
title: Troubleshooting Guide
description: Common issues and solutions for markdown-magic, including installation problems, transform errors, configuration issues, and debugging tips
---

# Troubleshooting Guide

Common issues and solutions when using markdown-magic.

## Installation Issues

### NPM Installation Fails

**Problem**: `npm install markdown-magic` fails with permissions or network errors.

**Solutions**:
```bash
# Use yarn instead
yarn add markdown-magic --dev

# Clear npm cache
npm cache clean --force
npm install markdown-magic --save-dev

# Use different registry
npm install markdown-magic --save-dev --registry https://registry.npmjs.org/
```

### Version Conflicts

**Problem**: Conflicting versions with other packages.

**Solution**: Check peer dependencies and update:
```bash
npm ls markdown-magic
npm update markdown-magic
```

## Transform Issues

### Transform Not Found

**Problem**: `Transform "myTransform" not found`

**Causes & Solutions**:

1. **Transform not registered**:
   ```js
   // Make sure transform is in config
   module.exports = {
     transforms: {
       myTransform: require('./transforms/my-transform') // ✅
     }
   }
   ```

2. **Typo in transform name**:
   ```md
   <!-- docs myTransform --> ✅
   <!-- docs mytransform --> ❌ (case sensitive)
   ```

3. **Transform file not found**:
   ```js
   // Check file path
   myTransform: require('./transforms/my-transform.js') // ✅
   myTransform: require('./transforms/missing.js')     // ❌
   ```

### Transform Not Executing

**Problem**: Transform block exists but doesn't run.

**Debug steps**:

1. **Check comment syntax**:
   ```md
   <!-- docs transformName -->  ✅
   <!--- docs transformName --> ❌ (extra dash)
   <!-- docs transformName ->   ❌ (missing dash)
   ```

2. **Verify match word**:
   ```js
   // If you changed matchWord in config
   module.exports = {
     matchWord: 'auto-gen', // Must match in markdown
   }
   ```
   
   ```md
   <!-- auto-gen transformName --> ✅
   <!-- docs transformName -->  ❌ (wrong match word)
   ```

3. **Check file glob pattern**:
   ```bash
   # Make sure your files match the pattern
   md-magic --files '**/*.md'      # All .md files
   md-magic --files './docs/*.md'  # Only docs folder
   ```

### Options Not Parsed

**Problem**: Transform receives empty or incorrect options.

**Common syntax errors**:

```md
<!-- Correct syntax -->
<!-- docs transform option='value' another=42 -->

<!-- Incorrect syntax -->
<!-- docs transform option=value -->           ❌ (missing quotes)
<!-- docs transform option = 'value' -->       ❌ (spaces around =)
<!-- docs transform option='value missing' --> ❌ (unmatched quotes)
```

**Complex options**:
```md
<!-- Arrays -->
<!-- docs transform items=['a', 'b', 'c'] -->

<!-- Objects (use JSON string) -->
<!-- docs transform config='{"key": "value"}' -->

<!-- Multiline -->
<!-- docs transform
  longOption='very long value here'
  anotherOption=true
-->
```

## File Processing Issues

### Files Not Found

**Problem**: `No files found matching pattern`

**Solutions**:

1. **Check glob pattern**:
   ```bash
   # Test your glob pattern
   ls **/*.md                    # Check if files exist
   md-magic --files '**/*.md'     # Use quotes for glob
   ```

2. **Check working directory**:
   ```bash
   # Make sure you're in the right directory
   pwd
   ls -la *.md
   ```

3. **Use absolute paths**:
   ```js
   import path from 'path'
   
   const docsPath = path.join(__dirname, 'docs/**/*.md')
   markdownMagic(docsPath)
   ```

### Permission Errors

**Problem**: `EACCES: permission denied`

**Solutions**:
```bash
# Check file permissions
ls -la README.md

# Fix permissions
chmod 644 README.md

# Check directory permissions
chmod 755 docs/
```

### File Encoding Issues

**Problem**: Special characters appear corrupted.

**Solutions**:

1. **Specify encoding**:
   ```js
   module.exports = {
     encoding: 'utf8' // Default, but can be changed
   }
   ```

2. **Check file encoding**:
   ```bash
   file -bi filename.md  # Check encoding
   ```

3. **Convert encoding**:
   ```bash
   iconv -f ISO-8859-1 -t UTF-8 file.md > file_utf8.md
   ```

## Configuration Issues

### Config File Not Found

**Problem**: Custom config file not loaded.

**Solutions**:

1. **Use correct filename**:
   - `md.config.js` (auto-detected, preferred)
   - `markdown.config.js` (auto-detected, legacy)
   - Or specify: `--config ./my-config.js`

2. **Check file location**:
   ```bash
   # Config should be in project root or specify path
   ls -la md.config.js
   md-magic --config ./path/to/config.js
   ```

3. **Verify config syntax**:
   ```js
   // Correct export
   module.exports = {
     transforms: {}
   }
   
   // Not: export default {} (ES6 modules not supported yet)
   ```

### Transform Import Errors

**Problem**: `Cannot resolve module './transforms/my-transform'`

**Solutions**:

1. **Check file exists**:
   ```bash
   ls -la transforms/my-transform.js
   ```

2. **Use correct path**:
   ```js
   // Relative to config file
   transforms: {
     myTransform: require('./transforms/my-transform')     // ✅
     myTransform: require('./transforms/my-transform.js')  // ✅ (explicit)
     myTransform: require('transforms/my-transform')       // ❌ (missing ./)
   }
   ```

3. **Check module exports**:
   ```js
   // In transform file
   module.exports = function myTransform(content, options) {
     return content
   }
   
   // Not: export default function() {} (ES6 not supported)
   ```

## Runtime Errors

### Async Transform Issues

**Problem**: Async transforms not working properly.

**Solutions**:

1. **Return Promise**:
   ```js
   // Correct async transform
   module.exports = async function(content, options) {
     const result = await someAsyncOperation()
     return result
   }
   
   // Or return Promise
   module.exports = function(content, options) {
     return someAsyncOperation()
   }
   ```

2. **Handle Promise rejections**:
   ```js
   module.exports = async function(content, options) {
     try {
       return await riskyOperation()
     } catch (error) {
       console.error('Transform failed:', error)
       return content // Fallback
     }
   }
   ```

### Memory Issues

**Problem**: Process runs out of memory with large files.

**Solutions**:

1. **Process files in batches**:
   ```js
   const files = glob.sync('**/*.md')
   const batchSize = 10
   
   for (let i = 0; i < files.length; i += batchSize) {
     const batch = files.slice(i, i + batchSize)
     await Promise.all(batch.map(file => markdownMagic(file)))
   }
   ```

2. **Stream large files**:
   ```js
   // For very large files, consider streaming
   const fs = require('fs')
   const readline = require('readline')
   
   // Process line by line instead of loading entire file
   ```

### Network Errors

**Problem**: Remote transforms fail due to network issues.

**Solutions**:

1. **Add retry logic**:
   ```js
   async function fetchWithRetry(url, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url)
         return response
       } catch (error) {
         if (i === maxRetries - 1) throw error
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
       }
     }
   }
   ```

2. **Add timeout**:
   ```js
   const fetchWithTimeout = (url, timeout = 5000) => {
     return Promise.race([
       fetch(url),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Timeout')), timeout)
       )
     ])
   }
   ```

### Private GitHub Remote Files

**Problem**: A `REMOTE` transform points at a GitHub `blob` or `raw.githubusercontent.com` URL and fails with a 404, even though you can view the file in a browser.

This usually means the file is in a private repository or requires authenticated GitHub access. Markdown Magic resolves public GitHub file URLs through anonymous raw GitHub content first. Authenticated GitHub reads are disabled by default and must be enabled for a trusted run.

**Solutions**:

1. **Enable private GitHub reads for trusted runs only**:
   ```js
   module.exports = {
     allowPrivateGithub: true
   }
   ```

   Or for a single CLI run:
   ```bash
   md-magic --allow-private-github --files README.md
   ```

2. **Use a standard GitHub token environment variable in CI or local scripts**:
   ```md
   <!-- docs REMOTE
     src='https://github.com/owner/private-repo/blob/main/README.md'
   -->
   <!-- /docs -->
   ```

   When private GitHub reads are enabled, Markdown Magic checks `GITHUB_ACCESS_TOKEN` and `GITHUB_TOKEN` automatically. Prefer those environment variables over putting a token value in markdown.

3. **Use GitHub CLI auth locally**:
   ```bash
   gh auth status
   md-magic --allow-private-github --files README.md
   ```

4. **Disable GitHub CLI fallback in CI**:
   ```bash
   MARKDOWN_MAGIC_GH_CLI=0 md-magic --files README.md
   ```

5. **Check the source path**: GitHub `blob` URLs work, but the owner, repo, branch, and file path must point at a real file. If a branch name contains slashes, prefer a raw URL or pass explicit `ref` and `path` options.

Private files fetched this way become generated Markdown if you commit the output. Review generated diffs before publishing public documentation.

### Remote Cache

**Problem**: A `REMOTE` or remote `CODE` block keeps showing content from a recent request.

Markdown Magic caches successful remote responses outside the project directory by default. Normal remote responses are reused for 5 minutes. GitHub files pinned to a full 40-character commit SHA use a longer immutable cache TTL.

**Solutions**:

1. **Disable the cache while debugging**:
   ```js
   module.exports = {
     remoteCache: false
   }
   ```

   The equivalent object form is:
   ```js
   module.exports = {
     remoteCache: {
       enabled: false
     }
   }
   ```

2. **Force one CLI run to refetch everything**:
   ```bash
   md-magic --no-cache --files README.md
   ```

   `--no-remote-cache` is an equivalent alias.

3. **Use a shorter TTL for frequently changing sources**:
   ```js
   module.exports = {
     remoteCache: {
       ttl: 30 * 1000
     }
   }
   ```

4. **Move the cache to a known local path**:
   ```js
   module.exports = {
     remoteCache: {
       directory: '.cache/markdown-magic-remote'
     }
   }
   ```

5. **Clear the cache manually**: remove `markdown-magic/remote-cache-v1` from your OS cache directory, such as `~/Library/Caches/markdown-magic/remote-cache-v1` on macOS or `~/.cache/markdown-magic/remote-cache-v1` on Linux. If `XDG_CACHE_HOME` is set, check `$XDG_CACHE_HOME/markdown-magic/remote-cache-v1`.

6. **Keep private reads memory-only**:
   ```js
   module.exports = {
     allowPrivateGithub: true,
     remoteCache: {
       cachePrivate: false
     }
   }
   ```

   `allowPrivateGithub` controls whether private GitHub content may be resolved. `remoteCache.cachePrivate` only controls whether authenticated private responses are written to disk. When both private GitHub reads and private caching are enabled, private fetched content can persist in the local cache until it expires or is manually removed.

Cache hits are logged as `Getting remote (from cache):` when remote request logging is enabled. Set `logRemoteRequests: false` to hide all remote request logs, or `remoteCache: { logHits: false }` to hide only cache-hit logs.

## Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Enable debug output
DEBUG=markdown-magic:* md-magic

# Or in Node.js
process.env.DEBUG = 'markdown-magic:*'
```

```js
// In your transforms
const debug = require('debug')('markdown-magic:my-transform')

module.exports = function myTransform(content, options) {
  debug('Processing with options:', options)
  
  const result = processContent(content, options)
  
  debug('Result length:', result.length)
  return result
}
```

## Performance Issues

### Slow Processing

**Problem**: Processing takes too long.

**Solutions**:

1. **Profile your transforms**:
   ```js
   module.exports = function slowTransform(content, options) {
     console.time('slowTransform')
     
     const result = expensiveOperation(content)
     
     console.timeEnd('slowTransform')
     return result
   }
   ```

2. **Add caching**:
   ```js
   const cache = new Map()
   
   module.exports = function cachedTransform(content, options) {
     const key = JSON.stringify(options)
     if (cache.has(key)) {
       return cache.get(key)
     }
     
     const result = expensiveOperation(content, options)
     cache.set(key, result)
     
     return result
   }
   ```

3. **Optimize file patterns**:
   ```bash
   # More specific patterns are faster
   md-magic --files './docs/*.md'     # ✅ Specific directory
   md-magic --files '**/*.md'         # ❌ Searches everywhere
   ```

## Getting Help

### Community Support

1. **GitHub Issues**: [Report bugs](https://github.com/DavidWells/markdown-magic/issues)
2. **Discussions**: [Ask questions](https://github.com/DavidWells/markdown-magic/discussions)
3. **Examples**: Check the [examples directory](../examples/)

### Debug Information

When reporting issues, include:

```bash
# Version information
npm list markdown-magic
node --version
npm --version

# Debug output
DEBUG=markdown-magic:* md-magic --files './problematic-file.md' 2> debug.log

# File contents (if not sensitive)
cat problematic-file.md

# Configuration
cat md.config.js
```

### Minimal Reproduction

Create a minimal example that reproduces the issue:

```js
// minimal-repro.js
const markdownMagic = require('markdown-magic')

const content = `
<!-- docs problemTransform option='value' -->
<!-- /docs -->
`

require('fs').writeFileSync('test.md', content)

markdownMagic('test.md', {
  transforms: {
    problemTransform: ({ content, options }) => {
      // Minimal version of your problem
      return 'result'
    }
  }
}).then(() => {
  console.log('Result:', require('fs').readFileSync('test.md', 'utf8'))
}).catch(console.error)
```
