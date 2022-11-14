const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic, processContents, processFile } = require('./')

test('Main API', () => {
  assert.equal(typeof markdownMagic, 'function')
  assert.equal(typeof processContents, 'function')
  assert.equal(typeof processFile, 'function')
})

test.run()