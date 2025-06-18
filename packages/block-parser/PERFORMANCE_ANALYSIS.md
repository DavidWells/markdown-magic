# Block Parser Performance Analysis

## Current Performance Issues

### 1. Complex Regex Pattern (Line 357)
```javascript
const blockPattern = new RegExp(`([ \\t]*)${open}([\\s\\S]*?)${close}`, 'gmi')
```

**Issues:**
- Uses nested capturing groups which can cause backtracking
- `[\\s\\S]*?` lazy quantifier can be slow on large inputs
- The `open` and `close` patterns themselves contain complex nested groups

### 2. Multiple Regex Executions (Lines 264-266)
```javascript
const openCount = (str.match(open) || []).length
const closeCount = (str.match(close) || []).length
```

**Issues:**
- Executes the same regex patterns multiple times on the entire content
- Could be combined into a single pass

### 3. Legacy Parameter Parsing (Line 189)
```javascript
if (paramString.match(/^:|^\?/)) {
```

**Issues:**
- Creates new regex objects on each call
- Multiple sequential regex operations on the same string

### 4. Transform Name Parsing (Line 149)
```javascript
const dashInTransform = params.match(/^(-[^\s]*)/)
```

**Issues:**
- Additional regex execution for every block
- Could be optimized with string operations

## Optimizations Implemented

### 1. Compiled Regex Patterns
- Pre-compile commonly used regex patterns
- Cache regex objects to avoid recreation

### 2. Single-Pass Tag Counting
- Count open and close tags in a single pass
- Use a more efficient counting algorithm

### 3. String Operations Instead of Regex
- Replace simple regex patterns with string operations where possible
- Use indexOf/substring for better performance

### 4. Reduced Backtracking
- Optimize regex patterns to reduce backtracking
- Use atomic groups and possessive quantifiers where appropriate

## Benchmark Results

See benchmark.js for detailed performance testing.

## Memory Optimizations

1. Reuse regex objects
2. Avoid creating unnecessary intermediate strings
3. Process content in chunks for very large inputs