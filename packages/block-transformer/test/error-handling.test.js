// Tests for error handling in blockTransformer

const { test } = require('uvu')
const assert = require('uvu/assert')
const { blockTransformer } = require('../src')

test('throws when removeComments is used without outputPath', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  try {
    await blockTransformer(text, {
      removeComments: true,
      transforms: {
        test: (api) => api.content
      }
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('removeComments'))
    assert.ok(e.message.includes('outputPath'))
  }
})

test('removeComments works when outputPath differs from srcPath', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    srcPath: '/input.md',
    outputPath: '/output.md',
    removeComments: true,
    transforms: {
      test: (api) => api.content
    }
  })

  assert.is(result.stripComments, true)
  assert.is(result.isNewPath, true)
})

test('propagates parse errors from unbalanced tags', async () => {
  const text = `
<!-- block test -->
content missing close tag
`
  try {
    await blockTransformer(text, {
      transforms: {
        test: (api) => api.content
      }
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('unbalanced') || e.message.includes('Fix content'))
  }
})

test('includes srcPath in error message when available', async () => {
  const text = `
<!-- block test -->
missing close tag
`
  try {
    await blockTransformer(text, {
      srcPath: '/path/to/file.md',
      transforms: {
        test: (api) => api.content
      }
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('/path/to/file.md'))
  }
})

test('handles transform returning number', async () => {
  const text = `
<!-- block numberTest -->
original
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {
      numberTest: () => 42
    }
  })

  assert.ok(result.updatedContents.includes('42'))
})

test('handles transform returning array', async () => {
  const text = `
<!-- block arrayTest -->
original
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {
      arrayTest: () => ['item1', 'item2', 'item3']
    }
  })

  assert.ok(result.updatedContents.includes('item1'))
  assert.ok(result.updatedContents.includes('item2'))
})

test('handles transform returning object', async () => {
  const text = `
<!-- block objectTest -->
original
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {
      objectTest: () => ({ key: 'value', nested: { a: 1 } })
    }
  })

  assert.ok(result.updatedContents.includes('key'))
  assert.ok(result.updatedContents.includes('value'))
})

test('handles async transform that throws', async () => {
  const text = `
<!-- block failingTransform -->
content
<!-- /block -->
`
  try {
    await blockTransformer(text, {
      transforms: {
        failingTransform: async () => {
          throw new Error('Transform failed!')
        }
      }
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('Transform failed!'))
  }
})

test('handles sync transform that throws', async () => {
  const text = `
<!-- block syncFail -->
content
<!-- /block -->
`
  try {
    await blockTransformer(text, {
      transforms: {
        syncFail: () => {
          throw new Error('Sync transform error')
        }
      }
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('Sync transform error'))
  }
})

test('handles null config gracefully', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  // Should not throw, just return unchanged content
  const result = await blockTransformer(text, null)
  assert.ok(result.missingTransforms.length > 0)
})

test('handles empty transforms object', async () => {
  const text = `
<!-- block unknownTransform -->
content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {}
  })

  assert.is(result.missingTransforms.length, 1)
  assert.is(result.missingTransforms[0].transform, 'unknownTransform')
})

test('handles middleware that throws', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  try {
    await blockTransformer(text, {
      transforms: {
        test: (api) => api.content
      },
      beforeMiddleware: [
        {
          name: 'failingMiddleware',
          transform: () => {
            throw new Error('Middleware error')
          }
        }
      ]
    })
    assert.unreachable('should have thrown')
  } catch (e) {
    assert.ok(e.message.includes('Middleware error'))
  }
})

test('handles transform returning undefined', async () => {
  const text = `
<!-- block noReturn -->
original content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {
      noReturn: () => undefined
    }
  })

  // Original content should be preserved when transform returns undefined
  assert.ok(result.updatedContents.includes('original content'))
})

test('handles transform returning empty string', async () => {
  const text = `
<!-- block emptyReturn -->
original content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    transforms: {
      emptyReturn: () => ''
    }
  })

  // Empty string is falsy, so original content is preserved (per implementation)
  assert.ok(result.updatedContents.includes('original content'))
})

test('forceRemoveComments bypasses safety check and strips comments from updatedContents', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    srcPath: '/same/path.md',
    outputPath: '/same/path.md',
    forceRemoveComments: true,
    transforms: {
      test: (api) => 'transformed'
    }
  })

  assert.is(result.stripComments, true)
  assert.not.ok(result.updatedContents.includes('<!-- block'))
  assert.not.ok(result.updatedContents.includes('<!-- /block'))
  assert.ok(result.updatedContents.includes('transformed'))
})

test('forceRemoveComments works without outputPath', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
`
  const result = await blockTransformer(text, {
    forceRemoveComments: true,
    transforms: {
      test: (api) => 'transformed'
    }
  })

  assert.is(result.stripComments, true)
  assert.not.ok(result.updatedContents.includes('<!-- block'))
  assert.not.ok(result.updatedContents.includes('<!-- /block'))
  assert.ok(result.updatedContents.includes('transformed'))
})

test.run()
