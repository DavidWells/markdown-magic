const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic } = require('../lib')
const { deepLog } = require('../lib/utils/logs')

const {
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
} = require('./config')

const SILENT = true

test('Throw on unbalanced blocks', async () => {
  const fileName = 'error-unbalanced.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  // console.log('filePath', filePath)
  let error
  try {
    await markdownMagic(filePath, {
      open: 'docs-start',
      close: 'docs-end',
      outputDir: OUTPUT_DIR,
      silent: SILENT
    })
  } catch (e) {
    console.log(e)
    error = e
  }

  assert.ok(error, 'Missing match words dont time out')
  assert.ok(error.message.match(/Comment blocks are unbalanced in string/), 'Blocks are unbalanced error')
})

test('Throw on missing transforms single file', async () => {
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, 'error-missing-transforms.md')
  let error
  try {
    await markdownMagic(filePath, {
      open: 'doc-gen',
      close: 'end-doc-gen',
      outputDir: OUTPUT_DIR,
      failOnMissingTransforms: true,
      silent: SILENT
    })
  } catch (e) {
    error = e
  }
  // deepLog(error.message)
  assert.ok(error, 'error was thrown')
  assert.ok(error.message.match(/Markdown Magic error: 1/), 'Has 1 errors')
})

test('Throw on missing transforms multi file', async () => {
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, 'error-missing-transforms*.md')
  let error
  try {
    await markdownMagic(filePath, {
      open: 'doc-gen',
      close: 'end-doc-gen',
      outputDir: OUTPUT_DIR,
      failOnMissingTransforms: true,
      silent: SILENT
    })
  } catch (e) {
    error = e
  }
  // deepLog(error)
  assert.ok(error, 'error was thrown')
  assert.ok(error.message.match(/Markdown Magic errors: 2/), 'Has 2 errors')
})

test.run()