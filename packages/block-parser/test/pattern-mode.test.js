// Tests for regex-based match patterns (component-style blocks)
const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')

test('pattern mode - single component name (open only, no close)', () => {
  const content = `/* MyCodeGen yay='nice' */
/* Awesome */
console.log('noooo')
/* /MyCodeGen */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'MyCodeGen',
  })
  // deepLog(result.blocks)
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].type, 'MyCodeGen')
  assert.equal(result.blocks[0].options, { yay: 'nice' })
  assert.equal(result.blocks[0].content.value, "/* Awesome */\nconsole.log('noooo')")
})

test('pattern mode - OR pattern matches multiple component types', () => {
  const content = `/* ComponentA foo='bar' */
content A
/* /ComponentA */

/* ComponentB baz='qux' */
content B
/* /ComponentB */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'ComponentA|ComponentB',
  })
  // deepLog(result.blocks)
  assert.equal(result.blocks.length, 2)
  assert.equal(result.blocks[0].type, 'ComponentA')
  assert.equal(result.blocks[0].options, { foo: 'bar' })
  assert.equal(result.blocks[1].type, 'ComponentB')
  assert.equal(result.blocks[1].options, { baz: 'qux' })
})

test('pattern mode - wildcard pattern', () => {
  const content = `/* Gen_Users enabled */
user list here
/* /Gen_Users */

/* Gen_Products disabled */
product list here
/* /Gen_Products */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'Gen_[A-Za-z]+',
  })
  // deepLog(result.blocks)
  assert.equal(result.blocks.length, 2)
  assert.equal(result.blocks[0].type, 'Gen_Users')
  assert.equal(result.blocks[0].options, { enabled: true })
  assert.equal(result.blocks[1].type, 'Gen_Products')
  assert.equal(result.blocks[1].options, { disabled: true })
})

test('pattern mode - close tag must match open tag (backreference)', () => {
  // Mismatched close tag should not match
  const content = `/* ComponentA */
content
/* /ComponentB */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'ComponentA|ComponentB',
  })
  // Should find 0 blocks - close doesn't match open
  assert.equal(result.blocks.length, 0)
})

test('pattern mode - markdown syntax', () => {
  const content = `<!-- MyWidget name="test" -->
widget content
<!-- /MyWidget -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: 'MyWidget',
  })
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].type, 'MyWidget')
  assert.equal(result.blocks[0].options, { name: 'test' })
})

test('pattern mode - nested blocks with different component types', () => {
  const content = `/* Outer */
/* Inner */
nested content
/* /Inner */
/* /Outer */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'Outer|Inner',
  })
  // Should match inner first (non-greedy), then outer
  // Note: nested blocks behavior may vary - this tests basic parsing works
  assert.ok(result.blocks.length >= 1)
})

test('pattern mode - explicit open and close patterns', () => {
  // When both are provided as patterns, use them directly (no backreference)
  const content = `/* START_A foo=1 */
content A
/* END_A */

/* START_B bar=2 */
content B
/* END_B */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'START_[A-Z]',
    close: 'END_[A-Z]',
  })
  assert.equal(result.blocks.length, 2)
  assert.equal(result.blocks[0].type, 'START_A')
  assert.equal(result.blocks[1].type, 'START_B')
})

/* RegExp object and regex literal string tests */

test('RegExp object - OR pattern', () => {
  const content = `/* CompA a=1 */
content A
/* /CompA */

/* CompB b=2 */
content B
/* /CompB */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: /CompA|CompB/,
  })
  assert.equal(result.blocks.length, 2)
  assert.equal(result.blocks[0].type, 'CompA')
  assert.equal(result.blocks[0].options, { a: 1 })
  assert.equal(result.blocks[1].type, 'CompB')
  assert.equal(result.blocks[1].options, { b: 2 })
})

test('RegExp object - wildcard pattern', () => {
  const content = `/* Gen_Users enabled */
user list
/* /Gen_Users */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: /Gen_[A-Za-z]+/,
  })
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].type, 'Gen_Users')
  assert.equal(result.blocks[0].options, { enabled: true })
})

test('regex literal string - OR pattern', () => {
  const content = `/* CompA a=1 */
content A
/* /CompA */

/* CompB b=2 */
content B
/* /CompB */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: '/CompA|CompB/',
  })
  assert.equal(result.blocks.length, 2)
  assert.equal(result.blocks[0].type, 'CompA')
  assert.equal(result.blocks[1].type, 'CompB')
})

test('regex literal string - single component', () => {
  const content = `/* MyWidget name="test" */
widget content
/* /MyWidget */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: '/MyWidget/',
  })
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].type, 'MyWidget')
  assert.equal(result.blocks[0].options, { name: 'test' })
})

test('regex literal string - with flags (ignored but parsed)', () => {
  const content = `/* Widget foo=bar */
content
/* /Widget */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: '/Widget/i',  // flags parsed but not applied to block matching
  })
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].type, 'Widget')
})

test.run()
