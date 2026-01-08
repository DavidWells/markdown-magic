// Tests for legacyParseOptions (via parseBlocks public API)

const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')

const opts = {
  open: 'DOCS:START',
  close: 'DOCS:END',
  syntax: 'md',
  firstArgIsType: true,
}

test('legacyParseOptions - parses colon syntax key=value', () => {
  const content = `<!-- DOCS:START (CODE:src=./path/to/file.js) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'CODE')
  assert.is(result.blocks[0].options.src, './path/to/file.js')
  assert.is(result.blocks[0].context.isLegacy, true)
})

test('legacyParseOptions - parses multiple options with ampersand', () => {
  const content = `<!-- DOCS:START (CODE:src=./file.js&lines=22-44) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].options.src, './file.js')
  assert.is(result.blocks[0].options.lines, '22-44')
})

test('legacyParseOptions - parses three or more options', () => {
  const content = `<!-- DOCS:START (TEST:a=1&b=2&c=3&d=4) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.equal(result.blocks[0].options, { a: '1', b: '2', c: '3', d: '4' })
})

test('legacyParseOptions - parses question mark syntax', () => {
  const content = `<!-- DOCS:START (FETCH?url=https://example.com) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].type, 'FETCH')
  assert.is(result.blocks[0].options.url, 'https://example.com')
  assert.is(result.blocks[0].context.isLegacy, true)
})

test('legacyParseOptions - handles values with special characters', () => {
  const content = `<!-- DOCS:START (CODE:src=./path/to/file.js&format=json) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].options.src, './path/to/file.js')
  assert.is(result.blocks[0].options.format, 'json')
})

test('legacyParseOptions - handles values with equals signs', () => {
  // The regex /=(.+)/ should capture everything after the first =
  const content = `<!-- DOCS:START (TEST:equation=a=b+c) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].options.equation, 'a=b+c')
})

test('legacyParseOptions - stores raw options string', () => {
  const content = `<!-- DOCS:START (CODE:src=./file.js&lines=1-10) -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].optionsStr, 'src=./file.js&lines=1-10')
})

test('legacyParseOptions - non-legacy syntax does not set isLegacy', () => {
  const content = `<!-- DOCS:START myTransform src="./file.js" -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.is(result.blocks[0].context.isLegacy, undefined)
})

test('legacyParseOptions - empty options returns empty object', () => {
  // Test with modern syntax to show contrast
  const content = `<!-- DOCS:START emptyTest -->
content
<!-- DOCS:END -->`

  const result = parseBlocks(content, opts)
  assert.equal(result.blocks[0].options, {})
})

test.run()
