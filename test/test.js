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
  // fs.emptyDirSync(outputDir)
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

test('<!-- AUTO-GENERATED-CONTENT:START (TOC)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'TOC-test.md')
  const config = {
    outputDir: outputDir
  }
  markdownMagic(filePath, config)
  const newfile = path.join(config.outputDir, 'TOC-test.md')
  const newContent = fs.readFileSync(newfile, 'utf8')

  const expectedTest1 = `
<!-- AUTO-GENERATED-CONTENT:START (TOC) - Test #1: without option and the content with empty line  -->
- [Title A](#title-a)
  * [Subtitle z](#subtitle-z)
  * [Subtitle x](#subtitle-x)
- [Title B](#title-b)
- [Title C](#title-c)
<!-- AUTO-GENERATED-CONTENT:END -->`
  const regexTest1 = new RegExp(`(?=${expectedTest1.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "i")
  t.regex(newContent, regexTest1, 'Test #1 : without option and the content with empty line')

  const expectedTest2 = `
<!-- AUTO-GENERATED-CONTENT:START (TOC:collapse=true&collapseText=Click Me) - Test #2: with collapse options and the content with 'aaaaaaaaa'  -->
<details>
<summary>Click Me</summary>

- [Title A](#title-a)
  * [Subtitle z](#subtitle-z)
  * [Subtitle x](#subtitle-x)
- [Title B](#title-b)
- [Title C](#title-c)

</details>
<!-- AUTO-GENERATED-CONTENT:END -->`
  const regexTest2 = new RegExp(`(?=${expectedTest2.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "i")
  t.regex(newContent, regexTest2, "Test #2: with collapse options and the content with 'aaaaaaaaa'")

  const expectedTest3 = `
<!-- AUTO-GENERATED-CONTENT:START (TOC:collapse=true&collapseText=Click Me=I have the power) - Test #3: with collapseText contains character '='  -->
<details>
<summary>Click Me=I have the power</summary>

- [Title A](#title-a)
  * [Subtitle z](#subtitle-z)
  * [Subtitle x](#subtitle-x)
- [Title B](#title-b)
- [Title C](#title-c)

</details>
<!-- AUTO-GENERATED-CONTENT:END -->`
  const regexTest3 = new RegExp(`(?=${expectedTest3.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "i")
  t.regex(newContent, regexTest3, "Test #3: with collapseText contains character '='")

  const expectedTest4 = `
<!-- AUTO-GENERATED-CONTENT:START (TOC) - Test #4: without option and the content is empty  -->
- [Title A](#title-a)
  * [Subtitle z](#subtitle-z)
  * [Subtitle x](#subtitle-x)
- [Title B](#title-b)
- [Title C](#title-c)
<!-- AUTO-GENERATED-CONTENT:END -->`
  const regexTest4 = new RegExp(`(?=${expectedTest4.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "i")
  t.regex(newContent, regexTest4, 'Test #4 : without option and the content is empty')

  const expectedTest5 = `
<!-- AUTO-GENERATED-CONTENT:START (TOC) - Test #5: without option and tags with same line  -->
- [Title A](#title-a)
  * [Subtitle z](#subtitle-z)
  * [Subtitle x](#subtitle-x)
- [Title B](#title-b)
- [Title C](#title-c)
<!-- AUTO-GENERATED-CONTENT:END -->`
  const regexTest5 = new RegExp(`(?=${expectedTest5.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "i")
  t.regex(newContent, regexTest5, 'Test #5 : without option and tags with same line')

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
    t.regex(newContent, /require\('dox'\)/, 'remote code snippet inserted')
  })

  if (filePathExists(newfile)) {
    // fs.emptyDirSync(outputDir)
  }
  // remove test file after assertion
})

test('<!-- AUTO-GENERATED-CONTENT:START (REMOTE)-->', t => {
  const filePath = path.join(__dirname, 'fixtures', 'REMOTE-test.md')

  const config = { outputDir: outputDir }
  markdownMagic(filePath, config, function() {
    const newfile = path.join(config.outputDir, 'REMOTE-test.md')
    const newContent = fs.readFileSync(newfile, 'utf8')
    // check local code
    t.regex(newContent, /Markdown Magic/, 'word "Markdown Magic" not found in remote block')
    // remove test file after assertion
    fs.emptyDirSync(outputDir)
  })
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
