// Tests for normalizeBlankLines utility

const { test } = require('uvu')
const assert = require('uvu/assert')
const { normalizeBlankLines } = require('../src')

test('collapses multiple blank lines to single blank line', () => {
  const input = `line 1


line 2`
  const result = normalizeBlankLines(input)
  assert.is(result, `line 1

line 2`)
})

test('preserves single blank lines', () => {
  const input = `line 1

line 2`
  const result = normalizeBlankLines(input)
  assert.is(result, input)
})

test('collapses 3+ blank lines to single', () => {
  const input = `line 1




line 2`
  const result = normalizeBlankLines(input)
  assert.is(result, `line 1

line 2`)
})

test('preserves blank lines inside fenced code blocks (```)', () => {
  const input = `before

\`\`\`bash
line 1


line 2
\`\`\`

after`
  const result = normalizeBlankLines(input)
  assert.is(result, input)
})

test('preserves blank lines inside fenced code blocks (~~~)', () => {
  const input = `before

~~~js
line 1


line 2
~~~

after`
  const result = normalizeBlankLines(input)
  assert.is(result, input)
})

test('handles multiple code blocks', () => {
  const input = `start


\`\`\`
code 1


more code
\`\`\`


middle


\`\`\`
code 2


more
\`\`\`


end`
  const expected = `start

\`\`\`
code 1


more code
\`\`\`

middle

\`\`\`
code 2


more
\`\`\`

end`
  const result = normalizeBlankLines(input)
  assert.is(result, expected)
})

test('handles code block with language specifier', () => {
  const input = `text


\`\`\`javascript
const x = 1


const y = 2
\`\`\`


more text`
  const expected = `text

\`\`\`javascript
const x = 1


const y = 2
\`\`\`

more text`
  const result = normalizeBlankLines(input)
  assert.is(result, expected)
})

test('handles empty input', () => {
  assert.is(normalizeBlankLines(''), '')
})

test('handles input with no blank lines', () => {
  const input = `line 1
line 2
line 3`
  assert.is(normalizeBlankLines(input), input)
})

test('handles indented code fences', () => {
  const input = `text


  \`\`\`
  code


  more
  \`\`\`


end`
  const expected = `text

  \`\`\`
  code


  more
  \`\`\`

end`
  const result = normalizeBlankLines(input)
  assert.is(result, expected)
})

test.run()
