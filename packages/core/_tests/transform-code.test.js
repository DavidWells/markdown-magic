// Tests for CODE transform

const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { FIXTURE_DIR, MARKDOWN_FIXTURE_DIR, OUTPUT_DIR } = require('./config')

function getNewFile(result) {
  if (!result.results || !result.results[0]) {
    return null
  }
  return result.results[0].outputPath
}

const SILENT = true

test('CODE - local file inclusion', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  const localCode = newContent.match(/module\.exports\.run/g)
  assert.ok(localCode, 'local code snippet inserted')
  assert.is(localCode.length, 2, 'correct amount of local code blocks')
})

test('CODE - local file with line range', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  const ranges = newContent.match(/```js\n  const baz = 'foobar'\n  console\.log\(`Hello \${baz}`\)\n```/g)
  assert.ok(ranges, 'local code snippet with range lines inserted')
  assert.is(ranges.length, 3, 'correct amount of ranged code blocks')
})

test('CODE - remote raw URL', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  const remote = newContent.match(/require\('markdown-magic'\)/g)
  assert.ok(remote, 'remote code snippet inserted')
  assert.is(remote.length, 2, 'correct amount of remote code blocks')
})

test('CODE - remote URL with line range', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  const remoteWithRange = newContent.match(/```json\n  "private": true,\n  "version": "1.0.0",\n```/g)
  assert.ok(remoteWithRange, 'remote code snippet with range lines inserted')
  assert.is(remoteWithRange.length, 2, 'correct amount of remote ranged code blocks')
})

test('CODE - legacy colon syntax works', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  // The fixture has legacy syntax blocks that should still work
  assert.ok(newContent.includes('module.exports.run'), 'legacy syntax processed correctly')
})

test.run()
