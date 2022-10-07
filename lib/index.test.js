const fs = require('fs')
const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { markdownMagic } = require('./')
const {
  FIXTURE_DIR,
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
} = require('../test/config')

test('Main API', () => {
  assert.equal(typeof markdownMagic, 'function')
})

test.run()