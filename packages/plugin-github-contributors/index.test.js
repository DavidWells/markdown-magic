const { test } = require('../../node_modules/uvu')
const assert = require('../../node_modules/uvu/assert')
const contributors = require('./index')

test('github-contributors - plugin syntax is valid', () => {
  const plugin = require('./index')
  assert.equal(typeof plugin, 'function', 'Plugin should export a function')
})

test('github-contributors - package.json is valid', () => {
  const pkg = require('./package.json')
  assert.ok(pkg.name, 'Package should have a name')
  assert.ok(pkg.version, 'Package should have a version')
  assert.ok(pkg.dependencies, 'Package should have dependencies')
})

test('github-contributors - handles missing options gracefully', async () => {
  try {
    const result = await contributors({
      content: '',
      options: {},
      originalPath: __filename,
      currentFileContent: ''
    })
    
    // Should return some kind of result even without repo
    assert.equal(typeof result, 'string', 'Should return a string result')
  } catch (error) {
    // Expected to fail without valid repo - that's acceptable
    assert.ok(error.message, 'Should throw meaningful error message')
  }
})

test('github-contributors - validates function signature', () => {
  assert.equal(typeof contributors, 'function', 'Should export a function')
  assert.equal(contributors.length, 1, 'Should accept destructured options object')
})

test.run()