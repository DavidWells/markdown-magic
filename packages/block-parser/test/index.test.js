const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')

test('Custom patterns', async () => {
  const content = `
TotallyCustom uppercase
content with comments
BlockHere
  `
  
  const options = {
    content,
    removeComments: true,
    customPatterns: {
      openPattern: /TotallyCustom (.*)/g,
      closePattern: /BlockHere/g,
    },
  }
  const result = parseBlocks(content, options)
  deepLog(result)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'unknown')
})

test.run()