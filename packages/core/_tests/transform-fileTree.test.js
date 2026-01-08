// Tests for fileTree transform

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

test('fileTree - generates tree structure', async () => {
  const fileName = 'transform-fileTree.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/├──/), 'tree connectors generated')
  assert.ok(newContent.match(/└──/), 'tree endings generated')
})

test('fileTree - generates list format', async () => {
  const fileName = 'transform-fileTree.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/- \*\*.*\/\*\*/), 'list format directories generated')
})

test('fileTree - includes fixture files', async () => {
  const fileName = 'transform-fileTree.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/simple\.js/), 'fixture files included in tree')
})

test.run()
