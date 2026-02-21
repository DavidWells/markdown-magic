const { test } = require('uvu')
const assert = require('uvu/assert')
const path = require('path')
const fs = require('fs').promises
const { processFile } = require('../src')

/**
 * @typedef {import('../src').ProcessFileOptions} ProcessFileOptions
 */

// Create temporary test files for testing
const testDir = path.join(__dirname, 'temp')
const testFile = path.join(testDir, 'test.md')
const outputFile = path.join(testDir, 'output.md')

// Setup and cleanup
async function setup() {
  try {
    await fs.mkdir(testDir, { recursive: true })
  } catch (e) {
    // Directory might already exist
  }
}

async function cleanup() {
  try {
    // @ts-ignore
    await fs.rm(testDir, { recursive: true })
  } catch (e) {
    // Directory might not exist or not be empty
  }
}

// Mock transforms for testing
const mockTransforms = {
  uppercase: (api) => {
    return api.content.toUpperCase()
  },
  wordcount: (api) => {
    const words = api.content.trim().split(/\s+/).length
    return `Word count: ${words}`
  },
  file: (api) => {
    return `Content from ${api.options.src || 'unknown file'}`
  }
}

test.before(setup)
test.after(cleanup)

test('should process file content with transforms', async () => {
  const content = `
# Test Document

<!-- block uppercase -->
hello world
<!-- /block -->

Some other content.
  `

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    dryRun: true,
    transforms: mockTransforms
  }

  const result = await processFile(options)
  
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('HELLO WORLD'))
  assert.is(result.transforms.length, 1)
})

test('should process file from path', async () => {
  const content = `
# Test File

<!-- block wordcount -->
This is a test document with multiple words to count.
<!-- /block -->
  `
  
  await fs.writeFile(testFile, content)

  /** @type {ProcessFileOptions} */
  const options = {
    srcPath: testFile,
    dryRun: true,
    transforms: mockTransforms
  }

  const result = await processFile(options)
  
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('Word count: 10'))
})

test('should write to output file when not dry run', async () => {
  const content = `
<!-- block uppercase -->
test content
<!-- /block -->
  `

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    outputPath: outputFile,
    transforms: mockTransforms
  }

  const result = await processFile(options)

  console.log('result', result)
  assert.is(result.isChanged, true, 'isChanged')
  assert.is(result.isNewPath, true, 'isNewPath')
  
  // Check output file was created
  const outputContent = await fs.readFile(outputFile, 'utf8')
  assert.ok(outputContent.includes('TEST CONTENT'))
})

test('should apply transforms to source file when applyTransformsToSource is true', async () => {
  const content = `
<!-- block uppercase -->
source content
<!-- /block -->
  `
  
  await fs.writeFile(testFile, content)

  /** @type {ProcessFileOptions} */
  const options = {
    srcPath: testFile,
    applyTransformsToSource: true,
    transforms: mockTransforms
  }

  const result = await processFile(options)
  
  assert.is(result.isChanged, true)
  
  // Check source file was updated
  const updatedContent = await fs.readFile(testFile, 'utf8')
  assert.ok(updatedContent.includes('SOURCE CONTENT'))
})

test('should detect syntax from file extension', async () => {
  const jsFile = path.join(testDir, 'test.js')
  const content = `
/* block uppercase */
const test = 'hello world'
/* /block */
  `
  
  await fs.writeFile(jsFile, content)

  /** @type {ProcessFileOptions} */
  const options = {
    srcPath: jsFile,
    dryRun: true,
    open: 'block',
    close: '/block',
    transforms: mockTransforms
  }

  const result = await processFile(options)
  
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes(`CONST TEST = 'HELLO WORLD'`))
})

test('should handle missing transforms', async () => {
  const content = `
<!-- block nonexistent -->
test content
<!-- /block -->
  `

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    dryRun: true,
    transforms: {}
  }

  const result = await processFile(options)
  
  assert.is(result.missingTransforms.length, 1)
  assert.is(result.isChanged, false)
})

test('should handle both srcPath and content using preloaded content', async () => {
  /** @type {ProcessFileOptions} */
  const options = {
    srcPath: '/some/nonexistent/path',
    content: 'preloaded content',
    dryRun: true
  }

  // When both srcPath and content are provided, content is used as preloaded
  // file contents (caching optimization) — no error should be thrown.
  const result = await processFile(options)
  assert.ok(result, 'Should return a result without throwing')
})

test('should handle file with output directory', async () => {
  const content = `
<!-- block uppercase -->
directory test
<!-- /block -->
  `
  
  const outputDir = path.join(testDir, 'output')
  const expectedOutput = path.join(outputDir, 'result.md')

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    outputPath: expectedOutput,
    output: {
      directory: outputDir
    },
    transforms: mockTransforms
  }

  const result = await processFile(options)
  
  assert.is(result.isChanged, true)
  
  // Check output file exists in output directory
  const outputContent = await fs.readFile(expectedOutput, 'utf8')
  assert.ok(outputContent.includes('DIRECTORY TEST'))
})

test('Custom patterns', async () => {
  const content = `
TotallyCustom uppercase
content with comments
BlockHere
  `

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    outputPath: outputFile,
    removeComments: true,
    customPatterns: {
      openPattern: /TotallyCustom (.*)/g,
      closePattern: /BlockHere/g,
    },
    transforms: Object.assign({}, mockTransforms, {
      custom: (api) => {
        return api.content.toUpperCase()
      }
    })
  }

  const result = await processFile(options)

  console.log('result', result)

  assert.is(result.stripComments, true)
  assert.is(result.isNewPath, true)
})

test('removeComments should strip comment blocks from output file', async () => {
  const content = `# Test Document

<!-- block uppercase -->
hello world
<!-- /block -->

Some content in between.

<!-- block wordcount -->
one two three four five
<!-- /block -->

End of document.
`

  const removeCommentsOutput = path.join(testDir, 'stripped.md')

  /** @type {ProcessFileOptions} */
  const options = {
    content,
    outputPath: removeCommentsOutput,
    removeComments: true,
    transforms: mockTransforms
  }

  const result = await processFile(options)

  assert.is(result.stripComments, true, 'stripComments should be true')
  assert.is(result.isNewPath, true, 'isNewPath should be true')
  assert.is(result.isChanged, true, 'isChanged should be true')

  // Read the output file and verify comments are stripped
  const outputContent = await fs.readFile(removeCommentsOutput, 'utf8')

  // Should contain the transformed content
  assert.ok(outputContent.includes('HELLO WORLD'), 'should have transformed content')
  assert.ok(outputContent.includes('Word count: 5'), 'should have wordcount transform')

  // Should NOT contain comment blocks
  assert.not.ok(outputContent.includes('<!-- block'), 'should not have opening comment')
  assert.not.ok(outputContent.includes('<!-- /block'), 'should not have closing comment')
})

test.run()