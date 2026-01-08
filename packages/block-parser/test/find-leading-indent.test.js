// Tests for findLeadingIndent (via parseBlocks public API)

const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')

const opts = {
  open: 'START',
  close: 'END',
  syntax: 'md'
}

test('findLeadingIndent - no indent on single line block', () => {
  const content = '<!-- START test -->content<!-- END -->'
  const result = parseBlocks(content, opts)

  // Single line blocks have 0 indent
  assert.is(result.blocks[0].open.indent, 0)
  assert.is(result.blocks[0].close.indent, 0)
})

test('findLeadingIndent - detects 2-space indent on multiline block', () => {
  const content = `
  <!-- START test -->
  content here
  <!-- END -->
`
  const result = parseBlocks(content, opts)

  assert.is(result.blocks[0].open.indent, 2)
  assert.is(result.blocks[0].close.indent, 2)
})

test('findLeadingIndent - detects 4-space indent on multiline block', () => {
  const content = `
    <!-- START test -->
    content here
    <!-- END -->
`
  const result = parseBlocks(content, opts)

  assert.is(result.blocks[0].open.indent, 4)
  assert.is(result.blocks[0].close.indent, 4)
})

test('findLeadingIndent - different indent on open vs close', () => {
  const content = `
  <!-- START test -->
content
    <!-- END -->
`
  const result = parseBlocks(content, opts)

  assert.is(result.blocks[0].open.indent, 2)
  assert.is(result.blocks[0].close.indent, 4)
})

test('findLeadingIndent - no indent when at start of line', () => {
  const content = `
<!-- START test -->
content
<!-- END -->
`
  const result = parseBlocks(content, opts)

  assert.is(result.blocks[0].open.indent, 0)
  assert.is(result.blocks[0].close.indent, 0)
})

test('findLeadingIndent - handles tab indent', () => {
  const content = `
\t<!-- START test -->
\tcontent
\t<!-- END -->
`
  const result = parseBlocks(content, opts)

  // Tab counts as 1 character of indent
  assert.is(result.blocks[0].open.indent, 1)
})

test('findLeadingIndent - handles mixed spaces and tabs', () => {
  const content = `
  \t<!-- START test -->
  content
  \t<!-- END -->
`
  const result = parseBlocks(content, opts)

  // 2 spaces + 1 tab = 3 characters
  assert.is(result.blocks[0].open.indent, 3)
})

test('findLeadingIndent - block.indent captures minimum content indent', () => {
  const content = `
  <!-- START test -->
    indented content
      more indented
    back to less
  <!-- END -->
`
  const result = parseBlocks(content, opts)

  // block.indent captures the dedented minimum indent of the block itself
  assert.is(result.blocks[0].block.indent, 2)
})

test('findLeadingIndent - content.indent captures content indent', () => {
  const content = `
<!-- START test -->
    four spaces
    on content
<!-- END -->
`
  const result = parseBlocks(content, opts)

  // content.indent is the minimum indent found in the content
  assert.is(result.blocks[0].content.indent, 4)
})

test('findLeadingIndent - multiple blocks with different indents', () => {
  const content = `
<!-- START first -->
no indent
<!-- END -->

  <!-- START second -->
  two spaces
  <!-- END -->

      <!-- START third -->
      six spaces
      <!-- END -->
`
  const result = parseBlocks(content, opts)

  assert.is(result.blocks[0].open.indent, 0)
  assert.is(result.blocks[1].open.indent, 2)
  assert.is(result.blocks[2].open.indent, 6)
})

test.run()
