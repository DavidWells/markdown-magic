const { test } = require('uvu')
const assert = require('uvu/assert')

function dedentInlineManual(text) {
  if (!text) return { minIndent: 0, text: '' }
  const lines = text.split('\n')
  let minIndent = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue
    let indent = 0
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) indent++
    if (minIndent === null || indent < minIndent) minIndent = indent
  }
  if (minIndent === null) return { minIndent: 0, text: text.trim() }
  
  let result = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let leading = 0
    while (leading < line.length && (line[leading] === ' ' || line[leading] === '\t')) leading++
    const toRemove = Math.min(leading, minIndent)
    result += line.slice(toRemove) + '\n'
  }
  result = result.slice(0, -1) // Remove trailing newline
  const cleanResult = result.replace(/^[\r\n]+|[\r\n]+$/g, '')
  return { minIndent, text: cleanResult }
}

function dedentString(string) {
  const result = dedentInlineManual(string)
  return result.text
  // return dedent`${string}`
}

function dedentInline(text) {
 if (!text) return { minIndent: 0, text: '' }
 
 const lines = text.split('\n')
 let minIndent = null
 
 // Find the minimum indentation across all non-empty lines
 for (const line of lines) {
   if (line.trim() === '') continue
   const match = line.match(/^(\s*)/)
   const indent = match ? match[1].length : 0
   if (minIndent === null || indent < minIndent) {
     minIndent = indent
   }
 }
 
 if (minIndent === null) return { minIndent: 0, text: text.trim() }
 
 // Remove minIndent spaces from each line
 let result = lines
   .map(line => {
     const match = line.match(/^(\s*)/)
     const leading = match ? match[1].length : 0
     const toRemove = Math.min(leading, minIndent)
     return line.slice(toRemove)
   })
   .join('\n')
 
 // Only trim blank lines, not spaces
 const cleanResult = result.replace(/^[\r\n]+|[\r\n]+$/g, '')
 return { minIndent, text: cleanResult }
}

test('dedentString - basic functionality', () => {
  const input = `
    hello
    world
  `
  const expected = 
`hello
world`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - removes leading blank line', () => {
  const input = 
`
    hello
    world`
  const expected = 
`hello
world`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - removes trailing blank line', () => {
  const input = 
`    hello
    world
  `
  const expected = 
`hello
world`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles no indentation', () => {
  const input = 
`hello
world`
  const expected = 
`hello
world`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles mixed indentation', () => {
  const input = 
`
    hello
  world
    test
`
  const expected = 
`  hello
world
  test`
  
  // Debug: Let's see what the function is doing
  const lines = input.split('\n')
  console.log('Input lines:')
  lines.forEach((line, i) => {
    console.log(`Line ${i}: "${line}" (length: ${line.length})`)
  })
  
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  console.log('expected', `"${expected}"`)
  assert.is(result, expected)
})

test('dedentString - handles tabs', () => {
  const input = 
`
	hello
	world`
  const expected = `hello
world`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles comment block case', () => {
  const input = 
`/* 
  comment inside 
*/`
  const expected = 
`/* 
  comment inside 
*/`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles multiline comment with odd spacing', () => {
  const input = 
`
  /* 
    comment inside 
    with more content
  */`
  const expected = 
`/* 
  comment inside 
  with more content
*/`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles empty string', () => {
  const input = ''
  const expected = ''
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles single line', () => {
  const input = '    hello'
  const expected = 'hello'
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles single line with no indentation', () => {
  const input = 'hello'
  const expected = 'hello'
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentString - handles complex comment structure', () => {
  const input = 
`/* 
      GENERATED c 
    */
    /* 
      comment inside 
    */
    /* END-GENERATED */`
  const expected = 
`/* 
      GENERATED c 
    */
    /* 
      comment inside 
    */
    /* END-GENERATED */`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})


test('JS test', () => {
  const input = 
`/* 
  comment inside 
*/`
  const expected = 
`/* 
  comment inside 
*/`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})


test('JS test 2', () => {
  const input = 
`
  /* 
    comment inside 
  */
`
  const expected = 
`/* 
  comment inside 
*/`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})


test('JS test 3', () => {
  const input = 
`
  /**
   * comment inside 
   */
`
  const expected = 
`/**
 * comment inside 
 */`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('JS test 4', () => {
  const input = 
`
        /**
         * comment inside 
         */
`
  const expected = 
`/**
 * comment inside 
 */`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('JS test 5', () => {
  const input = 
`  // cool
        /**
         * comment inside 
         */
`
  const expected = 
`// cool
      /**
       * comment inside 
       */`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('Yaml test', () => {
  const input = 
`
      ## block remove ##
      - name: Run tests two
        run: npm test two
      ## /block ##
` 
  const expected = 
`## block remove ##
- name: Run tests two
  run: npm test two
## /block ##`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('Yaml test 2 has new line', () => {
  const input = 
`
      ## block remove ##
      - name: Run tests two
        run: npm test two
      
      ## /block ##
` 
  const expected = 
`## block remove ##
- name: Run tests two
  run: npm test two

## /block ##`
  const result = dedentString(input)
  console.log('result', `"${result}"`)
  assert.is(result, expected)
})

test('dedentInline - returns minIndent and text', () => {
  const input = `
    hello
    world
  `
  const result = dedentInline(input)
  console.log('result', result)
  assert.is(result.minIndent, 4)
  assert.is(result.text, `hello
world`)
})

test('dedentInline - returns minIndent 0 for no indentation', () => {
  const input = 
`hello
world`
  const result = dedentInline(input)
  console.log('result', result)
  assert.is(result.minIndent, 0)
  assert.is(result.text, `hello
world`)
})

test('dedentInline - returns minIndent for mixed indentation', () => {
  const input = 
`
    hello
  world
    test
`
  const result = dedentInline(input)
  console.log('result', result)
  assert.is(result.minIndent, 2)
  assert.is(result.text, `  hello
world
  test`)
})

test('dedentInline - returns minIndent 0 for empty string', () => {
  const input = ''
  const result = dedentInline(input)
  console.log('result', result)
  assert.is(result.minIndent, 0)
  assert.is(result.text, '')
})

test('dedentInlineManual - returns minIndent 0 for empty string', () => {
  const input = ''
  const result = dedentInlineManual(input)
  console.log('result', result)
  assert.is(result.minIndent, 0)
  assert.is(result.text, '')
})

test('dedentInlineManual - basic functionality', () => {
  const input = `
    hello
    world
  `
  const expected = 
`hello
world`
  const result = dedentInlineManual(input)
  console.log('result', `"${result.text}"`)
  assert.is(result.text, expected)
  assert.is(result.minIndent, 4)
})

test('dedentInlineManual - handles mixed indentation', () => {
  const input = 
`
    hello
  world
    test
`
  const expected = 
`  hello
world
  test`
  
  const result = dedentInlineManual(input)
  console.log('result', `"${result.text}"`)
  console.log('expected', `"${expected}"`)
  assert.is(result.text, expected)
  assert.is(result.minIndent, 2)
})

test.run()

module.exports = { dedentInline, dedentInlineManual }
