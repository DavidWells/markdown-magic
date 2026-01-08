// Tests for wordCount transform

const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { FIXTURE_DIR, MARKDOWN_FIXTURE_DIR, OUTPUT_DIR } = require('./config')

// Temp fixture directory for dynamic test files
const TEMP_FIXTURE_DIR = path.join(FIXTURE_DIR, 'temp-wordcount')

function getNewFile(result) {
  if (!result.results || !result.results[0]) {
    return null
  }
  return result.results[0].outputPath
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

const SILENT = true

test('wordCount - counts words in file via fixture', async () => {
  const fileName = 'transform-wordCount.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    output: {
      directory: OUTPUT_DIR,
      applyTransformsToSource: false,
    },
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  // Fixture contains word count blocks that get filled with count
  assert.ok(newContent.match(/\d+/), 'word count number inserted')
})

test('wordCount - returns word count for file content', async () => {
  const content = `# Test Document

This is a test document with some words.

<!-- docs wordCount -->
0
<!-- /docs -->

More content here to count.`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'wordcount-file.md')
  fs.writeFileSync(tempFile, content)

  const result = await markdownMagic(tempFile, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const outputFile = getNewFile(result)
  assert.ok(outputFile, 'result has output path')
  const newContent = fs.readFileSync(outputFile, 'utf8')
  // Should have a number (word count)
  const match = newContent.match(/<!-- docs wordCount -->\n(\d+)\n<!-- \/docs -->/)
  assert.ok(match, 'word count number inserted')
  assert.ok(parseInt(match[1]) > 0, 'count is greater than 0')
})

test('wordCount - counts all words in file', async () => {
  const content = `one two three

<!-- docs wordCount -->
placeholder
<!-- /docs -->

four five`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'wordcount-count.md')
  fs.writeFileSync(tempFile, content)

  const result = await markdownMagic(tempFile, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const outputFile = getNewFile(result)
  assert.ok(outputFile, 'result has output path')
  const newContent = fs.readFileSync(outputFile, 'utf8')
  // Should have word count - counts all content including comments/markers
  const match = newContent.match(/<!-- docs wordCount -->\n(\d+)\n<!-- \/docs -->/)
  assert.ok(match, 'word count inserted')
  assert.ok(parseInt(match[1]) >= 5, 'counts at least the main words')
})

test.run()
