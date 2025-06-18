const { test } = require('../../node_modules/uvu')
const assert = require('../../node_modules/uvu/assert')
const fs = require('fs')
const path = require('path')

test('github-contributors - package.json exists and is valid', () => {
  const pkg = require('./package.json')
  assert.ok(pkg.name, 'Package should have a name')
  assert.ok(pkg.version, 'Package should have a version')
  assert.ok(pkg.dependencies, 'Package should have dependencies')
  assert.equal(pkg.name, '@markdown-magic/github-contributors', 'Package name should be correct')
})

test('github-contributors - index.js exists and has valid syntax', () => {
  const indexPath = path.join(__dirname, 'index.js')
  assert.ok(fs.existsSync(indexPath), 'index.js should exist')
  
  const indexContent = fs.readFileSync(indexPath, 'utf8')
  assert.ok(indexContent.includes('module.exports'), 'index.js should export a module')
  assert.ok(indexContent.includes('async function contributors'), 'index.js should contain the main contributors function')
})

test('github-contributors - JSDoc documentation exists', () => {
  const indexPath = path.join(__dirname, 'index.js')
  const indexContent = fs.readFileSync(indexPath, 'utf8')
  assert.ok(indexContent.includes('/**'), 'index.js should have JSDoc comments')
  assert.ok(indexContent.includes('CONTRIBUTORS'), 'index.js should have CONTRIBUTORS documentation')
})

test('github-contributors - module can be required', () => {
  const plugin = require('./index')
  assert.equal(typeof plugin, 'function', 'Plugin should export a function')
})

test.run()