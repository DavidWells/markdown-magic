const { test } = require('uvu')
const assert = require('uvu/assert')
const { blockTransformer } = require('../src')

/** @typedef {import('../src').ProcessContentConfig} ProcessContentConfig */

test('should transform markdown blocks', async () => {
  const text = `
<!-- DOCS:START test -->
Some content
<!-- DOCS:END -->
  `
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      test: (api) => {
        return api.content.toUpperCase()
      }
    }
  }

  const result = await blockTransformer(text, config)
  // console.log('result', result)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('SOME CONTENT'))
})

test('should handle missing transforms', async () => {
  const text = `
<!-- DOCS:START foobar -->
This will be transformed to uppercase
<!-- DOCS:END -->
  `
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {}
  }

  const result = await blockTransformer(text, config)
  console.log('result', result)
  assert.is(result.missingTransforms.length, 1)
})

test('should apply middleware', async () => {
  const text = `
<!-- DOCS:START foobar -->
Some content
<!-- DOCS:END -->
  `
  const beforeMiddleware = [{
    name: 'test',
    transform: (blockData) => {
      console.log('blockData', blockData)
      return blockData.content.value.toUpperCase()
    }
  }]
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {},
    beforeMiddleware
  }

  const result = await blockTransformer(text, config)
  assert.ok(result.updatedContents.includes('SOME CONTENT'))
})

test('should handle custom delimiters', async () => {
  const text = `
<!-- CUSTOM:START test -->
Some content
<!-- CUSTOM:END -->
  `
  /** @type {ProcessContentConfig} */
  const config = {
    open: 'CUSTOM:START',
    close: 'CUSTOM:END',
    transforms: {
      test: (api) => {
        return api.content.toUpperCase()
      }
    }
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('SOME CONTENT'))
})

test.run() 