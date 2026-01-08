// Tests for FILE transform

const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { MARKDOWN_FIXTURE_DIR, OUTPUT_DIR } = require('./config')

function getNewFile(result) {
  if (!result.results || !result.results[0]) {
    return null
  }
  return result.results[0].outputPath
}

const SILENT = true

test('FILE - includes local file content', async () => {
  const fileName = 'transform-file.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/module\.exports\.run/), 'local file content inserted')
})

test('FILE - includes file with line ranges', async () => {
  const fileName = 'transform-file.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  const matches = newContent.match(/const baz = 'foobar'/g)
  assert.ok(matches, 'file content with range inserted')
  assert.is(matches.length, 4, 'correct number of insertions')
})

test.run()
