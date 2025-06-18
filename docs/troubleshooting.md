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
   <!-- doc-gen myTransform --> ✅
   <!-- doc-gen mytransform --> ❌ (case sensitive)
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
   <!-- doc-gen transformName -->  ✅
   <!--- doc-gen transformName --> ❌ (extra dash)
   <!-- doc-gen transformName ->   ❌ (missing dash)
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
   <!-- doc-gen transformName -->  ❌ (wrong match word)
   ```

3. **Check file glob pattern**:
   ```bash
   # Make sure your files match the pattern
   md-magic --path '**/*.md'      # All .md files
   md-magic --path './docs/*.md'  # Only docs folder
   ```

### Options Not Parsed

**Problem**: Transform receives empty or incorrect options.

**Common syntax errors**:

```md
<!-- Correct syntax -->
<!-- doc-gen transform option='value' another=42 -->

<!-- Incorrect syntax -->
<!-- doc-gen transform option=value -->           ❌ (missing quotes)
<!-- doc-gen transform option = 'value' -->       ❌ (spaces around =)
<!-- doc-gen transform option='value missing' --> ❌ (unmatched quotes)
```

**Complex options**:
```md
<!-- Arrays -->
<!-- doc-gen transform items=['a', 'b', 'c'] -->

<!-- Objects (use JSON string) -->
<!-- doc-gen transform config='{"key": "value"}' -->

<!-- Multiline -->
<!-- doc-gen transform
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
   md-magic --path '**/*.md'     # Use quotes for glob
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
   - `markdown.config.js` (auto-detected)
   - `md.config.js` (auto-detected)
   - Or specify: `--config ./my-config.js`

2. **Check file location**:
   ```bash
   # Config should be in project root or specify path
   ls -la markdown.config.js
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
   md-magic --path './docs/*.md'     # ✅ Specific directory
   md-magic --path '**/*.md'         # ❌ Searches everywhere
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
DEBUG=markdown-magic:* md-magic --path './problematic-file.md' 2> debug.log

# File contents (if not sensitive)
cat problematic-file.md

# Configuration
cat markdown.config.js
```

### Minimal Reproduction

Create a minimal example that reproduces the issue:

```js
// minimal-repro.js
const markdownMagic = require('markdown-magic')

const content = `
<!-- doc-gen problemTransform option='value' -->
<!-- end-doc-gen -->
`

require('fs').writeFileSync('test.md', content)

markdownMagic('test.md', {
  transforms: {
    problemTransform: (content, options) => {
      // Minimal version of your problem
      return 'result'
    }
  }
}).then(() => {
  console.log('Result:', require('fs').readFileSync('test.md', 'utf8'))
}).catch(console.error)
```