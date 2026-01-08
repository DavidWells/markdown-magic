// Tests for verifyTagsBalanced (via parseBlocks public API)

const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')

const opts = {
  open: 'START',
  close: 'END',
  syntax: 'md'
}

test('verifyTagsBalanced - balanced tags parse successfully', () => {
  const content = `
<!-- START test -->
content
<!-- END -->
`
  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 1)
})

test('verifyTagsBalanced - multiple balanced tags parse successfully', () => {
  const content = `
<!-- START first -->
content 1
<!-- END -->

<!-- START second -->
content 2
<!-- END -->

<!-- START third -->
content 3
<!-- END -->
`
  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 3)
})

test('verifyTagsBalanced - throws on more open than close tags', () => {
  const content = `
<!-- START first -->
content 1
<!-- END -->

<!-- START second -->
missing close tag
`
  assert.throws(
    () => parseBlocks(content, opts),
    /unbalanced/i
  )
})

test('verifyTagsBalanced - throws on nested open without close', () => {
  const content = `
<!-- START outer -->
  <!-- START inner -->
  inner content
<!-- END -->
`
  assert.throws(
    () => parseBlocks(content, opts),
    /unbalanced/i
  )
})

test('verifyTagsBalanced - reports correct tag counts in error', () => {
  const content = `
<!-- START one -->
<!-- START two -->
<!-- START three -->
content
<!-- END -->
`
  try {
    parseBlocks(content, opts)
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('3'), 'error should mention 3 open tags')
    assert.ok(e.message.includes('1'), 'error should mention 1 close tag')
  }
})

test('verifyTagsBalanced - more close than open tags is allowed (edge case)', () => {
  // The parser handles this case gracefully - it allows more close than open
  // because the regex will only match complete blocks
  const content = `
<!-- START test -->
content
<!-- END -->
<!-- END -->
<!-- END -->
`
  // This should not throw - extra close tags are ignored
  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 1)
})

test('verifyTagsBalanced - empty content has balanced tags', () => {
  const result = parseBlocks('', opts)
  assert.is(result.blocks.length, 0)
})

test('verifyTagsBalanced - content without any tags is balanced', () => {
  const content = 'just some regular markdown content'
  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 0)
})

test('verifyTagsBalanced - single complete block is balanced', () => {
  const content = '<!-- START foo -->x<!-- END -->'
  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 1)
})

test.run()
