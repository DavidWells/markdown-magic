const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic } = require('../src')
const { resolveOutputPath, resolveCommonParent } = require('../src/utils/fs')
const {
  FIXTURE_DIR,
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
} = require('./config')

function getNewFile(result) {
  return result.results[0].outputPath
}

const SILENT = true
const UPDATE_FIXTURE = false
/**
 * Test Built in transforms
 */
test('<!-- AUTO-GENERATED-CONTENT:START (CODE)-->', async () => {
  const fileName = 'transform-code.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const globs = ['**/**/md/transform-cod*.md']
  const result = await markdownMagic(filePath, {
    // debug: true,
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })
  // console.log('result', result)

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  /*
  console.log('newContent', newContent)
  /** */

  // check local code
  const localCode = newContent.match(/module\.exports\.run/g)
  assert.ok(localCode, 'local code snippet inserted')
  assert.is(localCode.length, 2, 'correct amount localCode')

  // check local code with range lines
  const ranges = newContent.match(/```js\n  const baz = 'foobar'\n  console\.log\(`Hello \${baz}`\)\n```/g)
  assert.ok(ranges, 'local code snippet with range lines inserted')
  assert.is(ranges.length, 3, 'correct amount ranges')
  
  // check remotely fetched code
  const remote = newContent.match(/require\('markdown-magic'\)/g)
  assert.ok(remote, 'remote code snippet inserted')
  assert.is(remote.length, 2, 'correct amount remote')

  // check remotely fetched code with range lines
  const remoteWithRange = newContent.match(/```json\n  "private": true,\n  "version": "1.0.0",\n```/g)
  /*
  console.log('remoteWithRange', remoteWithRange)
  /** */
  assert.ok(remoteWithRange, 'remote code snippet with range lines inserted')
  assert.is(remoteWithRange.length, 2, 'correct amount remoteWithRange')

})

test('<!-- AUTO-GENERATED-CONTENT:START (FILE)-->', async () => {
  const fileName = 'transform-file.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })
  /*
  console.log('result', result)
  /** */

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  // check local code
  assert.ok(newContent.match(/module\.exports\.run/), 'local code snippet inserted')
  // check local code with range lines
  const matches = newContent.match(/const baz = 'foobar'/g)
  assert.ok(matches, 'local code snippet with range lines inserted')
  assert.is(matches.length, 4, 'Inserted correct amount')

})

test('<!-- AUTO-GENERATED-CONTENT:START wordCount -->', async () => {
  const fileName = 'transform-wordCount.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    output: {
      directory: OUTPUT_DIR,
      applyTransformsToSource: UPDATE_FIXTURE,
    },
    silent: SILENT
  })
  // console.log('result', result)

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/41/), 'Count added')
})

test('<!-- AUTO-GENERATED-CONTENT:START TOC -->', async () => {
  const fileName = 'transform-toc.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const newFilePath = path.join(OUTPUT_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })
  // console.log('result', result)
  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  // console.log('newContent', newContent)
  const whatever = newContent.match(/\[Whatever 2\]/gm)
  // console.log('whatever', whatever)
  const two = newContent.match(/\[Two Sub 2\]/gm)
  assert.ok(whatever, 'found', 'Found whatever')
  assert.is(whatever.length, 2, 'Found 2 whatever')
  assert.ok(two, 'found', 'Found two')
  assert.is(two.length, 2, 'Found 2 two')
})

test('<!-- AUTO-GENERATED-CONTENT:START remote -->', async () => {
  const fileName = 'transform-remote.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })
  // console.log('transform API', api)

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  assert.ok(newContent.match(/Stop scammers from the manipulating DOM/), 'has remote block')
})

test('Verify single line comments remain inline', async () => {
  const fileName = 'format-inline.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)
  const config = { 
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    open: 'AUTO-GENERATED-CONTENT:START',
    close: 'AUTO-GENERATED-CONTENT:END',
    transforms: {
      INLINE() {
        return `inlinecontent`
      },
      OTHER() {
        return `other-content`
      }
    },
    silent: SILENT
  }
  const result = await markdownMagic(filePath, config)
  const newFilePath = getNewFile(result)
  const newContent = fs.readFileSync(newFilePath, 'utf8') || ''
  assert.equal(newContent.match(/inlinecontent/gim).length, 2)
  assert.equal(newContent.match(/other-content/gim).length, 1)
})

test('Mixed transforms <!-- AUTO-GENERATED-CONTENT:START wordCount -->', async () => {
  const fileName = 'mixed.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const { results } = await markdownMagic(filePath, {
    open: 'docs-start',
    close: 'docs-end',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })

  assert.ok(results, 'Mixed match words don\'t time out')
})

test('<!-- docs fileTree -->', async () => {
  const fileName = 'transform-fileTree.md'
  const filePath = path.join(MARKDOWN_FIXTURE_DIR, fileName)

  const result = await markdownMagic(filePath, {
    open: 'docs',
    close: '/docs',
    outputDir: OUTPUT_DIR,
    applyTransformsToSource: UPDATE_FIXTURE,
    silent: SILENT
  })

  const newContent = fs.readFileSync(getNewFile(result), 'utf8')
  // Check that file tree structure is generated
  assert.ok(newContent.match(/├──/), 'file tree structure generated with tree connectors')
  assert.ok(newContent.match(/└──/), 'file tree structure generated with tree endings')
  // Check that list format works
  assert.ok(newContent.match(/- \*\*.*\/\*\*/), 'list format directories generated')
  // Check that fixture files are included
  assert.ok(newContent.match(/simple\.js/), 'fixture files included in tree')
})

test.run()