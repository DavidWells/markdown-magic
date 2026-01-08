// Tests for remote transform

const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { FIXTURE_DIR, MARKDOWN_FIXTURE_DIR, OUTPUT_DIR } = require('./config')

// Temp fixture directory for dynamic test files
const TEMP_FIXTURE_DIR = path.join(FIXTURE_DIR, 'temp-remote')

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

test('remote - fetches content from URL', async () => {
  const fileName = 'transform-remote.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'doc-block',
    close: '/doc-block',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/Stop scammers from the manipulating DOM/), 'remote content fetched')
})

test('remote - throws on missing url option', async () => {
  const content = `<!-- docs remote -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'remote-no-url.md')
  fs.writeFileSync(tempFile, content)

  let threw = false
  try {
    await markdownMagic(tempFile, {
      open: 'docs',
      close: '/docs',
      outputDir: OUTPUT_DIR,
      applyTransformsToSource: false,
      silent: SILENT
    })
  } catch (err) {
    threw = true
    assert.ok(err.message.includes('Invalid URL'), 'throws Invalid URL error')
  }
  assert.ok(threw, 'should throw on missing url')
})

test('remote - throws on invalid URL', async () => {
  const content = `<!-- docs remote url='https://invalid-url-that-does-not-exist-xyz.com/file.md' -->
original content
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'remote-invalid.md')
  fs.writeFileSync(tempFile, content)

  let threw = false
  try {
    await markdownMagic(tempFile, {
      open: 'docs',
      close: '/docs',
      outputDir: OUTPUT_DIR,
      applyTransformsToSource: false,
      silent: SILENT
    })
  } catch (err) {
    threw = true
    assert.ok(err.message.includes('ENOTFOUND') || err.message.includes('failed'), 'throws network error')
  }
  assert.ok(threw, 'should throw on invalid URL')
})

test('remote - fetches raw markdown from GitHub', async () => {
  const content = `<!-- docs remote url='https://raw.githubusercontent.com/DavidWells/types-with-jsdocs/master/README.md' -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'remote-github.md')
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
  // Should contain content from the remote file (JSDoc-related content)
  assert.ok(
    newContent.includes('JSDoc') || newContent.includes('types') || newContent.includes('TypeScript'),
    'remote GitHub content fetched'
  )
})

test.run()
