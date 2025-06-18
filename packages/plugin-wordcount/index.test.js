const { test } = require('../../node_modules/uvu')
const assert = require('../../node_modules/uvu/assert')
const wordcount = require('./index')

const sampleContent = 'This is a test content with eight words.'
const sampleFileContent = `# Title

This is a longer document with multiple paragraphs.

Here is another paragraph with more words to count.

- List item one
- List item two
- List item three

Total word count should be much higher than the comment block content.`

test('wordcount - counts words in file content by default', () => {
  const result = wordcount({
    content: sampleContent,
    currentFileContent: sampleFileContent,
    options: {}
  })
  
  // File content has many more words than comment content
  const fileWordCount = parseInt(result, 10)
  assert.ok(fileWordCount > 20, 'Should count words in entire file')
  assert.equal(typeof result, 'string', 'Should return string')
})

test('wordcount - counts words in comment content when useFile=false', () => {
  const result = wordcount({
    content: sampleContent,
    currentFileContent: sampleFileContent,
    options: { useBlock: true }
  })
  
  assert.equal(result, '8', 'Should count exactly 8 words in comment content')
})

test('wordcount - handles empty content', () => {
  const result = wordcount({
    content: '',
    currentFileContent: '',
    options: {}
  })
  
  assert.equal(result, '1', 'Empty string split returns 1 item')
})

test('wordcount - handles whitespace-only content', () => {
  const result = wordcount({
    content: '   \n\n   ',
    currentFileContent: '   \n\n   ',
    options: {}
  })
  
  assert.equal(result, '1', 'Whitespace-only content should return 1')
})

test('wordcount - default useFile option is true', () => {
  const result = wordcount({
    content: sampleContent,
    currentFileContent: sampleFileContent
    // No options provided - should default to useFile: true
  })
  
  const fileWordCount = parseInt(result, 10)
  assert.ok(fileWordCount > 8, 'Should use file content by default')
})

test.run()