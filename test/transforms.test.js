const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic } = require('../lib')
const {
  FIXTURE_DIR,
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
} = require('./config')

/**
 * Test Built in transforms
 */
test('<!-- AUTO-GENERATED-CONTENT:START (CODE)-->', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR 
  })

  const newContent = fs.readFileSync(newFilePath, 'utf8')
  // check local code
  assert.ok(newContent.match(/module\.exports\.run/), 'local code snippet inserted')
  // check local code with range lines
  assert.ok(newContent.match(/```js\n  const baz = 'foobar'\n  console\.log\(`Hello \${baz}`\)\n```/), 'local code snippet with range lines inserted')
  // check remotely fetched code
  assert.ok(newContent.match(/require\('doxxx'\)/), 'remote code snippet inserted')
  // check remotely fetched code with range lines
  assert.ok(newContent.match(/```json\n  "author": "David Wells",\n  "license": "MIT",\n```/), 'remote code snippet with range lines inserted')
})

test('<!-- AUTO-GENERATED-CONTENT:START (FILE)-->', async () => {
  const fileName = 'transform-file.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR 
  })

  const newContent = fs.readFileSync(newFilePath, 'utf8')
  // check local code
  assert.ok(newContent.match(/module\.exports\.run/), 'local code snippet inserted')
  // check local code with range lines
  assert.ok(newContent.match(/const baz = 'foobar'\n  console\.log\(`Hello \${baz}`\)/), 'local code snippet with range lines inserted')
})

test('<!-- AUTO-GENERATED-CONTENT:START wordCount -->', async () => {
  const fileName = 'transform-wordCount.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR 
  })

  const newContent = fs.readFileSync(newFilePath, 'utf8')
  assert.ok(newContent.match(/41/), 'Count added')
})

test('<!-- AUTO-GENERATED-CONTENT:START remote -->', async () => {
  const fileName = 'transform-remote.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  await markdownMagic(filePath, {
    open: 'doc-gen',
    close: 'end-doc-gen',
    outputDir: OUTPUT_DIR 
  })

  const newContent = fs.readFileSync(newFilePath, 'utf8')
  assert.ok(newContent.match(/Markdown Magic/), 'word "Markdown Magic" not found in remote block')
})

test('Verify single line comments remain inline', async () => {
  const fileName = 'format-inline.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const config = { 
    outputDir: OUTPUT_DIR,
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    transforms: {
      INLINE() {
        return `inlinecontent`
      },
      OTHER() {
        return `other-content`
      }
    }
  }
  await markdownMagic(filePath, config)
  const newFilePath = path.join(OUTPUT_DIR, fileName)
  const newContent = fs.readFileSync(newFilePath, 'utf8')
  assert.equal(newContent.match(/inlinecontent/gim).length, 2)
  assert.equal(newContent.match(/other-content/gim).length, 1)
})

test('Mixed transforms <!-- AUTO-GENERATED-CONTENT:START wordCount -->', async () => {
  const fileName = 'mixed.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const { data } = await markdownMagic(filePath, {
    open: 'docs-start',
    close: 'docs-end',
    outputDir: OUTPUT_DIR 
  })

  assert.ok(data, 'Mixed match words dont time out')
})

test.run()