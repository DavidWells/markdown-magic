// Tests for indentString utility function

const { test } = require('uvu')
const assert = require('uvu/assert')
const { indentString } = require('../src')

test('indentString - returns empty string unchanged', () => {
  assert.is(indentString('', 2), '')
})

test('indentString - returns null/undefined unchanged', () => {
  assert.is(indentString(null, 2), null)
  assert.is(indentString(undefined, 2), undefined)
})

test('indentString - indents single line', () => {
  assert.is(indentString('hello', 2), '  hello')
  assert.is(indentString('hello', 4), '    hello')
  assert.is(indentString('hello', 0), 'hello')
})

test('indentString - indents multiple lines', () => {
  const input = 'line1\nline2\nline3'
  const expected = '  line1\n  line2\n  line3'
  assert.is(indentString(input, 2), expected)
})

test('indentString - preserves existing indentation', () => {
  const input = '  already indented\n    more indented'
  const expected = '    already indented\n      more indented'
  assert.is(indentString(input, 2), expected)
})

test('indentString - handles empty lines in multiline string', () => {
  const input = 'line1\n\nline3'
  const expected = '  line1\n  \n  line3'
  assert.is(indentString(input, 2), expected)
})

test('indentString - handles lines with only whitespace', () => {
  const input = 'line1\n   \nline3'
  const expected = '  line1\n     \n  line3'
  assert.is(indentString(input, 2), expected)
})

test('indentString - handles large indent counts', () => {
  assert.is(indentString('x', 10), '          x')
})

test('indentString - handles trailing newline', () => {
  const input = 'line1\nline2\n'
  const expected = '  line1\n  line2\n  '
  assert.is(indentString(input, 2), expected)
})

test('indentString - handles leading newline', () => {
  const input = '\nline1\nline2'
  const expected = '  \n  line1\n  line2'
  assert.is(indentString(input, 2), expected)
})

test('indentString - handles tabs in content', () => {
  const input = 'line\twith\ttabs'
  const expected = '  line\twith\ttabs'
  assert.is(indentString(input, 2), expected)
})

test.run()
