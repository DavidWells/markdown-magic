// Tests for install transform - generates installation instructions

const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { FIXTURE_DIR, OUTPUT_DIR } = require('./config')

// Create temp fixture directory for these tests
const TEMP_FIXTURE_DIR = path.join(FIXTURE_DIR, 'temp-install')

function getNewFile(result) {
  if (!result.results || !result.results[0]) {
    console.log('No results:', result)
    return null
  }
  return result.results[0].outputPath
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

const SILENT = true

test('install - generates installation table with packageName', async () => {
  const content = `<!-- docs install packageName='my-awesome-package' -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-basic.md')
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

  // Should have installation header
  assert.ok(newContent.includes('# Installation'), 'has installation header')

  // Should have package manager table
  assert.ok(newContent.includes('| package manager | command |'), 'has table header')

  // Should have all package managers
  assert.ok(newContent.includes('npm install my-awesome-package'), 'has npm command')
  assert.ok(newContent.includes('pnpm add my-awesome-package'), 'has pnpm command')
  assert.ok(newContent.includes('yarn add my-awesome-package'), 'has yarn command')
  assert.ok(newContent.includes('bun install my-awesome-package'), 'has bun command')
})

test('install - isDev option adds -D flag', async () => {
  const content = `<!-- docs install packageName='dev-package' isDev=true -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-dev.md')
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

  assert.ok(newContent.includes('npm install dev-package -D'), 'npm has -D flag')
  assert.ok(newContent.includes('pnpm add dev-package -D'), 'pnpm has -D flag')
  assert.ok(newContent.includes('yarn add dev-package -D'), 'yarn has -D flag')
})

test('install - custom header option', async () => {
  const content = `<!-- docs install packageName='pkg' header='## Getting Started' -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-header.md')
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

  assert.ok(newContent.includes('## Getting Started'), 'has custom header')
  assert.not.ok(newContent.includes('# Installation'), 'default header not present')
})

test('install - header=false removes header', async () => {
  const content = `<!-- docs install packageName='pkg' header=false -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-no-header.md')
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

  assert.not.ok(newContent.includes('# Installation'), 'no header')
  assert.ok(newContent.includes('| package manager |'), 'table still present')
})

test('install - custom body option', async () => {
  const content = `<!-- docs install packageName='pkg' body='Custom installation instructions here.' -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-body.md')
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

  assert.ok(newContent.includes('Custom installation instructions here'), 'has custom body')
})

test('install - body=false removes body', async () => {
  const content = `<!-- docs install packageName='pkg' body=false -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-no-body.md')
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

  assert.not.ok(newContent.includes('Install the'), 'default body not present')
  assert.ok(newContent.includes('| package manager |'), 'table still present')
})

test('install - header without # gets # prepended', async () => {
  const content = `<!-- docs install packageName='pkg' header='Setup' -->
original
<!-- /docs -->`

  ensureDir(TEMP_FIXTURE_DIR)
  const tempFile = path.join(TEMP_FIXTURE_DIR, 'install-header-hash.md')
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

  assert.ok(newContent.includes('# Setup'), 'header has # prepended')
})

test.run()
