const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic, blockTransformer, processFile } = require('./')

test('Main API', () => {
  assert.equal(typeof markdownMagic, 'function')
  assert.equal(typeof blockTransformer, 'function')
  assert.equal(typeof processFile, 'function')
})

test.run()