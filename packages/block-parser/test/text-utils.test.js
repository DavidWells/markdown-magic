// Tests for text.js utility functions (getBlockText, getTextBetweenChars, findMinIndent)

const { test } = require('uvu')
const assert = require('uvu/assert')
const { getBlockText, getTextBetweenChars, findMinIndent } = require('../src/text')

// getTextBetweenChars tests
test('getTextBetweenChars - extracts substring from start to end', () => {
  const text = 'hello world'
  assert.is(getTextBetweenChars(text, 0, 5), 'hello')
  assert.is(getTextBetweenChars(text, 6, 11), 'world')
})

test('getTextBetweenChars - extracts middle portion', () => {
  const text = 'abcdefghij'
  assert.is(getTextBetweenChars(text, 2, 7), 'cdefg')
})

test('getTextBetweenChars - handles start of string', () => {
  const text = 'testing'
  assert.is(getTextBetweenChars(text, 0, 4), 'test')
})

test('getTextBetweenChars - handles end of string', () => {
  const text = 'testing'
  assert.is(getTextBetweenChars(text, 4, 7), 'ing')
})

test('getTextBetweenChars - returns empty for same start and end', () => {
  const text = 'testing'
  assert.is(getTextBetweenChars(text, 3, 3), '')
})

test('getTextBetweenChars - handles multiline text', () => {
  const text = 'line1\nline2\nline3'
  assert.is(getTextBetweenChars(text, 0, 5), 'line1')
  assert.is(getTextBetweenChars(text, 6, 11), 'line2')
})

test('getTextBetweenChars - handles single character', () => {
  const text = 'abcd'
  assert.is(getTextBetweenChars(text, 1, 2), 'b')
})

test('getTextBetweenChars - handles full string', () => {
  const text = 'complete'
  assert.is(getTextBetweenChars(text, 0, text.length), 'complete')
})

// getBlockText tests
test('getBlockText - extracts block with no indent', () => {
  const text = 'hello world content here'
  const block = { start: 6, end: 11, indent: 0 }
  assert.is(getBlockText(text, block), 'world')
})

test('getBlockText - extracts block with indent', () => {
  const text = 'hello world content here'
  const block = { start: 6, end: 11, indent: 2 }
  assert.is(getBlockText(text, block), '  world')
})

test('getBlockText - extracts block with larger indent', () => {
  const text = 'content'
  const block = { start: 0, end: 7, indent: 4 }
  assert.is(getBlockText(text, block), '    content')
})

test('getBlockText - handles empty block object', () => {
  const text = 'hello world'
  assert.is(getBlockText(text, {}), text)
})

test('getBlockText - handles undefined block', () => {
  const text = 'hello world'
  assert.is(getBlockText(text), text)
})

test('getBlockText - handles multiline content', () => {
  const text = 'line1\nline2\nline3'
  const block = { start: 0, end: 11, indent: 2 }
  assert.is(getBlockText(text, block), '  line1\nline2')
})

// findMinIndent tests
test('findMinIndent - returns 0 for no indentation', () => {
  const text = 'hello\nworld'
  assert.is(findMinIndent(text), 0)
})

test('findMinIndent - returns minimum indent with spaces', () => {
  const text = '  hello\n    world'
  assert.is(findMinIndent(text), 2)
})

test('findMinIndent - returns minimum indent with tabs', () => {
  const text = '\thello\n\t\tworld'
  assert.is(findMinIndent(text), 1)
})

test('findMinIndent - ignores empty lines', () => {
  const text = '    hello\n\n    world'
  assert.is(findMinIndent(text), 4)
})

test('findMinIndent - returns 0 for empty string', () => {
  assert.is(findMinIndent(''), 0)
})

test('findMinIndent - returns 0 for string with only whitespace', () => {
  assert.is(findMinIndent('   \n   \n   '), 0)
})

test('findMinIndent - handles single line', () => {
  assert.is(findMinIndent('    single line'), 4)
})

test('findMinIndent - handles mixed indentation levels', () => {
  const text = '      deeply indented\n  less indented\n        very deep'
  assert.is(findMinIndent(text), 2)
})

test('findMinIndent - handles first line with no indent', () => {
  const text = 'first line\n  second line\n    third line'
  assert.is(findMinIndent(text), 0)
})

test('findMinIndent - handles lines with only spaces before content', () => {
  const text = '  a\n    b\n  c'
  assert.is(findMinIndent(text), 2)
})

test('findMinIndent - handles tabs and spaces mixed', () => {
  const text = '\t test\n  other'
  // Tab counts as 1 character
  assert.is(findMinIndent(text), 2)
})

test.run()
