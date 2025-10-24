const { test } = require('uvu')
const assert = require('uvu/assert')
const { blockTransformer } = require('../src')

/** @typedef {import('../src').ProcessContentConfig} ProcessContentConfig */

// Mock some core transforms for testing
const mockCoreTransforms = {
  TOC: (api) => {
    return '# Table of Contents\n- [Example](#example)'
  },
  FILE: (api) => {
    return `File content from ${api.options.src || 'unknown file'}`
  },
  CODE: (api) => {
    return `\`\`\`\n// Code from ${api.options.src || 'unknown source'}\n\`\`\``
  }
}

test('should transform markdown blocks', async () => {
  const text = `
<!-- block test -->
Some content
<!-- /block -->
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
<!-- block foobar -->
This will be transformed to uppercase
<!-- /block -->
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
<!-- block foobar -->
Some content
<!-- /block -->
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

test('should handle multiple plugins', async () => {
  const text = `
<!-- block upperCase -->
hello world
<!-- /block -->

<!-- block reverse -->
abc def
<!-- /block -->

<!-- block addPrefix -->
content here
<!-- /block -->
  `
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      upperCase: (api) => {
        return api.content.toUpperCase()
      },
      reverse: (api) => {
        return api.content.split('').reverse().join('')
      },
      addPrefix: (api) => {
        return `PREFIX: ${api.content}`
      }
    }
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('HELLO WORLD'))
  assert.ok(result.updatedContents.includes('fed cba'))
  assert.ok(result.updatedContents.includes('PREFIX: content here'))
  assert.is(result.transforms.length, 3)
})

test('should handle multiple before middlewares', async () => {
  const text = `
<!-- block test -->
hello world
<!-- /block -->
  `
  const beforeMiddleware = [
    {
      name: 'upperCase',
      transform: (blockData) => {
        return blockData.content.value.toUpperCase()
      }
    },
    {
      name: 'addExclamation',
      transform: (blockData) => {
        return blockData.content.value + '!'
      }
    },
    {
      name: 'addPrefix',
      transform: (blockData) => {
        return `PREFIX: ${blockData.content.value}`
      }
    }
  ]
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      test: (api) => {
        return api.content
      }
    },
    beforeMiddleware
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('PREFIX: HELLO WORLD!'))
})

test('should handle multiple after middlewares', async () => {
  const text = `
<!-- block test -->
hello world
<!-- /block -->
  `
  const afterMiddleware = [
    {
      name: 'upperCase',
      transform: (blockData) => {
        return blockData.content.value.toUpperCase()
      }
    },
    {
      name: 'addSuffix',
      transform: (blockData) => {
        return `${blockData.content.value} - PROCESSED`
      }
    },
    {
      name: 'wrapBrackets',
      transform: (blockData) => {
        return `[${blockData.content.value}]`
      }
    }
  ]
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      test: (api) => {
        return api.content.trim()
      }
    },
    afterMiddleware
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('[HELLO WORLD - PROCESSED]'))
})

test('should handle both before and after middlewares together', async () => {
  const text = `
<!-- block test -->
content
<!-- /block -->
  `
  const beforeMiddleware = [
    {
      name: 'addBefore',
      transform: (blockData) => {
        return `BEFORE_${blockData.content.value}`
      }
    }
  ]
  const afterMiddleware = [
    {
      name: 'addAfter',
      transform: (blockData) => {
        return `${blockData.content.value}_AFTER`
      }
    }
  ]
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      test: (api) => {
        return `_${api.content.toUpperCase()}_`
      }
    },
    beforeMiddleware,
    afterMiddleware
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('_BEFORE_CONTENT__AFTER'))
})

test('should handle multiple plugins with core transforms', async () => {
  const text = `
<!-- block upperCase -->
hello world
<!-- /block -->

<!-- block TOC -->
<!-- /block -->
  `
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      upperCase: (api) => {
        return api.content.toUpperCase()
      },
      ...mockCoreTransforms
    }
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('HELLO WORLD'))
  assert.ok(result.updatedContents.includes('Table of Contents'))
  assert.is(result.transforms.length, 2)
})

test('should apply middlewares to multiple blocks independently', async () => {
  const text = `
<!-- block block1 -->
first block
<!-- /block -->

<!-- block block2 -->
second block
<!-- /block -->
  `
  const beforeMiddleware = [
    {
      name: 'addIndex',
      transform: (blockData) => {
        const blockIndex = blockData.transform === 'block1' ? '1' : '2'
        return `Block ${blockIndex}: ${blockData.content.value}`
      }
    }
  ]
  /** @type {ProcessContentConfig} */
  const config = {
    transforms: {
      block1: (api) => api.content.toUpperCase(),
      block2: (api) => api.content.toLowerCase()
    },
    beforeMiddleware
  }

  const result = await blockTransformer(text, config)
  assert.is(result.isChanged, true)
  assert.ok(result.updatedContents.includes('BLOCK 1: FIRST BLOCK'))
  assert.ok(result.updatedContents.includes('block 2: second block'))
})

test.run() 