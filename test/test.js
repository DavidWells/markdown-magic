import fs from 'fs-extra'
import path from 'path'
import test from 'ava'
import sinon from 'sinon'
import markdownMagic from '../index'

const markdownPath = path.join(__dirname, 'fixtures', 'test.md')
const outputDir = path.join(__dirname, 'fixtures', 'output')
const DEBUG = false

/**
 * Test markdownMagic Function
 */
test('if valid string path supplied', t => {
  markdownMagic(markdownPath)
  t.pass()
  // emptyDirectory(outputDir)
})

test('if valid glob pattern supplied', t => {
  const config = {
    outputDir: outputDir
  }
  markdownMagic(['test/fixtures/**/*md', '!test/fixtures/output/*.md'], config)
  t.pass()
  // empty dir
  //fs.emptyDirSync(outputDir)
})

test('if valid config supplied', t => {
  const config = {}
  markdownMagic(markdownPath, config)
  t.pass()
  // emptyDirectory(outputDir)
})

test('if callback function supplied, call it once', t => {
  const callback = sinon.spy()
  const config = {}
  markdownMagic(markdownPath, config, callback)
  t.true(callback.calledOnce)
  // emptyDirectory(outputDir)
})

test('if callback function supplied, as second arg, call it once', t => {
  const callback = sinon.spy()
  markdownMagic(markdownPath, callback)
  t.true(callback.calledOnce)
  // emptyDirectory(outputDir)
})

/**
 * Test Config settings
 */
test('if config.outputDir supplied, make new file', t => {
  const config = {
    outputDir: outputDir
  }
  markdownMagic(markdownPath, config, function() {
    const newfile = path.join(outputDir, 'test.md')
    const fileWasCreated = filePathExists(newfile)
    t.true(fileWasCreated)
    // remove test file after assertion
    // emptyDirectory(outputDir)
  })
})

test('if config.matchWord supplied, use it for comment matching', t => {
  const filePath = path.join(__dirname, 'fixtures', 'custom-match-word-test.md')
  const config = {
    matchWord: 'YOLO',
    outputDir: outputDir
  }
  markdownMagic(filePath, config)
  const newfile = path.join(config.outputDir, 'custom-match-word-test.md')
  const newContent = fs.readFileSync(newfile, 'utf8')
  t.regex(newContent, /module\.exports\.run/, 'local code snippet inserted')

  // remove test file after assertion
  fs.emptyDirSync(outputDir)
})

/**
 * Test Built in transforms
 */
test('<!-- AUTO-GENERATED-CONTENT:START (CODE)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'CODE-test.md')
  const config = { outputDir: outputDir }
  const newfile = path.join(config.outputDir, 'CODE-test.md')

  markdownMagic(filePath, config, function(err, data) {
    // console.log('data', data)
    const newContent = fs.readFileSync(newfile, 'utf8')
    // check local code
    t.regex(newContent, /module\.exports\.run/, 'local code snippet inserted')
    // check remotely fetched code
    t.regex(newContent, /const dox/, 'remote code snippet inserted')
  })

  if (filePathExists(newfile)) {
    // fs.emptyDirSync(outputDir)
  }
  // remove test file after assertion
})

test('<!-- AUTO-GENERATED-CONTENT:START (REMOTE)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'REMOTE-test.md')

  const config = { outputDir: outputDir }
  markdownMagic(filePath, config)
  const newfile = path.join(config.outputDir, 'REMOTE-test.md')
  const newContent = fs.readFileSync(newfile, 'utf8')
  // check local code
  t.regex(newContent, /Install/, 'word Install not found in remote block')

  // remove test file after assertion
  fs.emptyDirSync(outputDir)
})

test.after.always('guaranteed cleanup', t => {
  
})

/*
  Util functions
*/
function filePathExists(fp) {
  try {
    fs.accessSync(fp)
    return true
  } catch (err) {
    return false
  }
}

function emptyDirectory(filePath, callBack) {
  fs.emptyDirSync(filePath)
  callBack && callBack(null)
}
