const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic } = require('../index')
const {
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
} = require('./config')

function getNewFile(result) {
  return result.results[0].outputPath
}

const SILENT = true
const UPDATE_FIXTURE = false
const DEBUG = false

/**
 * Test TOC transforms
 */
test('TOC transform with maxDepth option', async () => {
  const fileName = 'transform-toc/README.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'doc-gen',
    close: 'end-doc-gen',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  
  if (DEBUG) {
    console.log('Output content:')
    console.log(newContent)
  }
  
  // Extract the main TOC content
  const tocMatch = newContent.match(/<!-- doc-gen TOC maxDepth=2 -->([\s\S]*?)<!-- end-doc-gen -->/m)
  assert.ok(tocMatch, 'TOC with maxDepth=2 was generated')
  const tocContent = tocMatch[1]
  
  // Check that the TOC contains the expected headings
  assert.ok(tocContent.includes('[Heading 1]'), 'Found Heading 1 in TOC')
  assert.ok(tocContent.includes('[heading 2]'), 'Found heading 2 in TOC')
  assert.ok(tocContent.includes('[heading 2 2]'), 'Found heading 2 2 in TOC')
  assert.ok(tocContent.includes('[Subsection one]'), 'Found Subsection one in TOC')
  assert.ok(tocContent.includes('[Heading 1 2]'), 'Found Heading 1 2 in TOC')
  assert.ok(tocContent.includes('[one two]'), 'Found one two in TOC')
  
  // Check that the TOC respects maxDepth=2 (no deeper headings)
  assert.not.ok(tocContent.includes('[nice]'), 'nice should not be in main TOC with maxDepth=2')
  assert.not.ok(tocContent.includes('[yyy]'), 'yyy should not be in main TOC with maxDepth=2')
  assert.not.ok(tocContent.includes('[four]'), 'four should not be in main TOC with maxDepth=2')
})

test('TOC transform with sub option', async () => {
  const fileName = 'transform-toc/README.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'doc-gen',
    close: 'end-doc-gen',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  
  if (DEBUG) {
    console.log('Output content for sub option:')
    console.log(newContent)
  }
  
  // Extract the sub TOC content
  const tocMatch = newContent.match(/<!-- doc-gen TOC sub -->([\s\S]*?)<!-- end-doc-gen -->/m)
  assert.ok(tocMatch, 'TOC with sub option was generated')
  const tocContent = tocMatch[1]
  
  // Check that the sub TOC contains the expected headings
  assert.ok(tocContent.includes('[nice]'), 'Found nice in sub TOC')
  assert.ok(tocContent.includes('[yyy]'), 'Found yyy in sub TOC')
  assert.ok(tocContent.includes('[four]'), 'Found four in sub TOC')
})

test('sectionToc transform', async () => {
  const fileName = 'transform-toc/README.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'doc-gen',
    close: 'end-doc-gen',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  
  if (DEBUG) {
    console.log('Output content for sectionToc:')
    console.log(newContent)
  }
  
  // Extract the section TOC content
  const tocMatch = newContent.match(/<!-- doc-gen sectionToc -->([\s\S]*?)<!-- end-doc-gen -->/m)
  assert.ok(tocMatch, 'sectionToc was generated')
  const tocContent = tocMatch[1]
  
  // Check that the sectionToc contains the expected headings
  assert.ok(tocContent.includes('[nice]'), 'Found nice in sectionToc')
  assert.ok(tocContent.includes('[yyy]'), 'Found yyy in sectionToc')
  assert.ok(tocContent.includes('[four]'), 'Found four in sectionToc')
})

test.run()
