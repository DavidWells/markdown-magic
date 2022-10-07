const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { findUp } = require('./fs')

test('Exports API', () => {
  assert.equal(typeof findUp, 'function', 'undefined val')
})

test('Finds file from file', async () => {
  const startDir = path.resolve(__dirname, '../index.js')
  const file = await findUp(startDir, 'README.md')
  assert.ok(file)
  assert.equal(path.basename(file), 'README.md')
})

test('Finds file from dir', async () => {
  const startDir = path.resolve(__dirname, '../')
  const file = await findUp(startDir, 'README.md')
  assert.ok(file)
  assert.equal(path.basename(file), 'README.md')
})

test.run()