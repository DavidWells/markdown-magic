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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

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

test('FILE - extracts markdown sections and heading levels', async () => {
  const tempDir = path.join(MARKDOWN_FIXTURE_DIR, 'temp-file')
  ensureDir(tempDir)

  const sourceFile = path.join(tempDir, 'README.md')
  const markdownFile = path.join(tempDir, 'sections.md')

  fs.writeFileSync(sourceFile, `# Package

## Install

Install docs.

### Browser

Browser docs.

## Usage

Usage docs.

## License

MIT.
`)

  fs.writeFileSync(markdownFile, `<!-- docs FILE
  src="./README.md"
  sections="Install"
  headings={[3]}
  removeLeadingH1
  shiftHeaders=1
-->
original
<!-- /docs -->`)

  const result = await markdownMagic(markdownFile, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: false,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.includes('### Install'), 'selected section was included and shifted')
  assert.ok(newContent.includes('#### Browser'), 'nested heading was included and shifted')
  assert.is(newContent.match(/Browser docs/g).length, 1, 'nested heading content was not duplicated')
  assert.not.ok(newContent.includes('## Usage'), 'unselected sibling was excluded')
  assert.not.ok(newContent.includes('## License'), 'unselected license was excluded')
})

test.run()
