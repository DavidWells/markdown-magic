---
title: Syntax Reference
description: Complete guide to markdown-magic block syntax, including all available syntax variations, option formats, and best practices
---

# Syntax Reference

Markdown-magic supports multiple syntax styles for transform blocks. Choose the style that works best for your project.

## Block Structure

All transform blocks follow this basic structure:

```md
<!-- matchWord transformName [options] -->
Content to be replaced
<!-- /matchWord -->
```

Where:
- `matchWord` is the opening keyword (default: `docs`)
- `transformName` is the name of the transform to apply
- `options` are optional parameters for the transform
- Content between the tags will be replaced by the transform output

## Syntax Variations

### Basic Syntax

The simplest form - just specify the transform name and options:

```md
<!-- docs transformName optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Curly Braces

Wrap the transform name in curly braces:

```md
<!-- docs {transformName} optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Square Brackets

Wrap the transform name in square brackets:

```md
<!-- docs [transformName] optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Parentheses

Wrap the transform name in parentheses:

```md
<!-- docs (transformName) optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- /docs -->
```

### Function Style

Use function-like syntax with parentheses for options:

```md
<!-- docs transformName(
  foo='bar'
  baz=['qux', 'quux']
) -->
content to be replaced
<!-- /docs -->
```

## Option Formats

### String Options
```md
<!-- docs transform option='string value' -->
```

### Boolean Options
```md
<!-- docs transform enabled=true disabled=false -->
```

### Array Options
```md
<!-- docs transform items=['one', 'two', 'three'] -->
```

### Multiple Options
```md
<!-- docs transform 
  url='https://example.com'
  format='json'
  cache=true
  items=['a', 'b', 'c']
-->
```

## Custom Match Words

You can customize the opening keyword by configuring the `matchWord` option:

```js
// In your config file
module.exports = {
  matchWord: 'auto-gen', // Custom match word
  // ... other options
}
```

Then use it in your markdown:

```md
<!-- auto-gen transformName -->
content to be replaced
<!-- /auto-gen -->
```

## Best Practices

1. **Consistency**: Choose one syntax style and stick with it across your project
2. **Readability**: Use the function style for complex options
3. **Comments**: Add comments above complex transforms to explain their purpose
4. **Validation**: Always test your syntax changes before committing

## Examples

See the [examples directory](../examples/) for real-world usage patterns and the [Advanced Usage](./advanced-usage.md) guide for complex scenarios.