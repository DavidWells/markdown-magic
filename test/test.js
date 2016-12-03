import path from 'path'
import fs from 'fs'
import test from 'ava'
import sinon from 'sinon'
import markdownSteriods from '../index'

const markdownPath = path.join(__dirname, 'fixtures', 'test.md')
const DEBUG = false
/**
 * Test markdownSteriods Function
 */
test('if valid path supplied', t => {
  markdownSteriods(markdownPath)
  t.pass()
})

test('if valid config supplied', t => {
  const config = {}
  markdownSteriods(markdownPath, config)
  t.pass()
})

test('if callback function supplied, call it once', t => {
  const callback = sinon.spy()
  const config = {}
  markdownSteriods(markdownPath, config, callback)

  t.true(callback.calledOnce)
})

/**
 * Test Config settings
 */
test('if config.outputPath supplied, make new file', t => {
  const config = {
    outputPath: path.join(__dirname, 'fixtures', 'output', 'different-path.md')
  }
  markdownSteriods(markdownPath, config)
  const fileWasCreated = filePathExists(config.outputPath)
  t.true(fileWasCreated)

  // remove test file after assertion
  if (fileWasCreated && !DEBUG) {
    fs.unlinkSync(config.outputPath)
  }
})

test('if config.matchWord supplied, use it for comment matching', t => {
  const filePath = path.join(__dirname, 'fixtures', 'custom-match-word-test.md')
  const config = {
    matchWord: 'YOLO',
    outputPath: path.join(__dirname, 'fixtures', 'output', 'test-match-word.md')
  }
  markdownSteriods(filePath, config)
  const newContent = fs.readFileSync(config.outputPath, 'utf8')
  t.regex(newContent, /module\.exports\.run/, 'local code snippet inserted')

  // remove test file after assertion
  if (filePathExists(config.outputPath) && !DEBUG) {
    fs.unlinkSync(config.outputPath)
  }
})

/**
 * Test Built in transforms
 */
test('<!-- AUTO-GENERATED-CONTENT:START (CODE)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'CODE-test.md')
  const updatedPath = path.join(__dirname, 'fixtures', 'output', 'new-code-path.md')

  const config = { outputPath: updatedPath }
  markdownSteriods(filePath, config)

  const newContent = fs.readFileSync(config.outputPath, 'utf8')
  // check local code
  t.regex(newContent, /module\.exports\.run/, 'local code snippet inserted')
  // check remotely fetched code
  t.regex(newContent, /const dox/, 'remote code snippet inserted')

  // remove test file after assertion
  if (filePathExists(config.outputPath) && !DEBUG) {
    fs.unlinkSync(config.outputPath)
  }
})

test('<!-- AUTO-GENERATED-CONTENT:START (REMOTE)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'REMOTE-test.md')
  const updatedPath = path.join(__dirname, 'fixtures', 'output', 'new-remote-path.md')

  const config = { outputPath: updatedPath }
  markdownSteriods(filePath, config)

  const newContent = fs.readFileSync(config.outputPath, 'utf8')
  // check local code
  t.regex(newContent, /Install/, 'word Install not found in remote block')

  // remove test file after assertion
  if (filePathExists(config.outputPath) && !DEBUG) {
    fs.unlinkSync(config.outputPath)
  }
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
