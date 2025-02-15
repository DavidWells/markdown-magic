## Syntax Examples

There are various syntax options. Choose your favorite.

### Basic

`openWord transformName [opts]`

```md
<!-- doc-gen transformName optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- end-doc-gen -->
```

### Curly braces

`openWord {transformName} [opts]`

```md
<!-- doc-gen {transformName} optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- end-doc-gen -->
```

### Square brackets

`openWord [transformName] [opts]`

```md
<!-- doc-gen [transformName] optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- end-doc-gen -->
```

### Parentheses

`openWord (transformName) [opts]`

```md
<!-- doc-gen (transformName) optionOne='hello' optionTwo='there' -->
content to be replaced
<!-- end-doc-gen -->
```

### Functions

`openWord transformName([opts])`

```md
<!-- doc-gen transformName(
  foo='bar'
  baz=['qux', 'quux']
) -->
content to be replaced
<!-- end-doc-gen -->
```