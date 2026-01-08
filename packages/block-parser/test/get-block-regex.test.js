// Tests for getBlockRegex function

const { test } = require('uvu')
const assert = require('uvu/assert')
const { getBlockRegex } = require('../src/index')

test('getBlockRegex - throws when openText is missing', () => {
  assert.throws(
    () => getBlockRegex({ closeText: 'END', syntax: 'md' }),
    /Missing options\.open/
  )
})

test('getBlockRegex - throws when closeText is missing', () => {
  assert.throws(
    () => getBlockRegex({ openText: 'START', syntax: 'md' }),
    /Missing options\.close/
  )
})

test('getBlockRegex - throws when syntax is missing/empty', () => {
  assert.throws(
    () => getBlockRegex({ openText: 'START', closeText: 'END', syntax: '' }),
    /Missing options\.syntax/
  )
})

test('getBlockRegex - throws for unknown syntax', () => {
  assert.throws(
    () => getBlockRegex({ openText: 'START', closeText: 'END', syntax: 'unknown-syntax-xyz' }),
    /Unknown syntax/
  )
})

test('getBlockRegex - returns pattern objects for md syntax', () => {
  const result = getBlockRegex({
    openText: 'DOC:START',
    closeText: 'DOC:END',
    syntax: 'md'
  })

  assert.ok(result.blockPattern instanceof RegExp)
  assert.ok(result.openPattern instanceof RegExp)
  assert.ok(result.closePattern instanceof RegExp)
})

test('getBlockRegex - returns pattern objects for html syntax', () => {
  const result = getBlockRegex({
    openText: 'BLOCK:START',
    closeText: 'BLOCK:END',
    syntax: 'html'
  })

  assert.ok(result.blockPattern instanceof RegExp)
  assert.ok(result.openPattern instanceof RegExp)
  assert.ok(result.closePattern instanceof RegExp)
})

test('getBlockRegex - returns pattern objects for js syntax', () => {
  const result = getBlockRegex({
    openText: 'COMMENT:START',
    closeText: 'COMMENT:END',
    syntax: 'js'
  })

  assert.ok(result.blockPattern instanceof RegExp)
  assert.ok(result.openPattern instanceof RegExp)
  assert.ok(result.closePattern instanceof RegExp)
})

test('getBlockRegex - blockPattern matches basic block', () => {
  const { blockPattern } = getBlockRegex({
    openText: 'START',
    closeText: 'END',
    syntax: 'md'
  })

  const content = '<!-- START myTransform -->\ncontent here\n<!-- END -->'
  const match = content.match(blockPattern)
  assert.ok(match, 'should match block')
  assert.ok(match[0].includes('content here'))
})

test('getBlockRegex - openPattern matches open tag', () => {
  const { openPattern } = getBlockRegex({
    openText: 'DOC:BEGIN',
    closeText: 'DOC:FINISH',
    syntax: 'md'
  })

  const openTag = '<!-- DOC:BEGIN transformer -->'
  const match = openTag.match(openPattern)
  assert.ok(match, 'should match open tag')
})

test('getBlockRegex - closePattern matches close tag', () => {
  const { closePattern } = getBlockRegex({
    openText: 'DOC:BEGIN',
    closeText: 'DOC:FINISH',
    syntax: 'md'
  })

  const closeTag = '<!-- DOC:FINISH -->'
  const match = closeTag.match(closePattern)
  assert.ok(match, 'should match close tag')
})

test('getBlockRegex - handles openText with slash (no word boundary)', () => {
  const { blockPattern } = getBlockRegex({
    openText: '/block',
    closeText: '//block',
    syntax: 'md'
  })

  assert.ok(blockPattern instanceof RegExp)
})

test('getBlockRegex - handles allowMissingTransforms flag', () => {
  const withTransform = getBlockRegex({
    openText: 'START',
    closeText: 'END',
    syntax: 'md',
    allowMissingTransforms: false
  })

  const withoutTransform = getBlockRegex({
    openText: 'START',
    closeText: 'END',
    syntax: 'md',
    allowMissingTransforms: true
  })

  // Both should return valid patterns
  assert.ok(withTransform.blockPattern instanceof RegExp)
  assert.ok(withoutTransform.blockPattern instanceof RegExp)

  // Pattern with allowMissingTransforms should match blocks without transform name
  const blockWithoutName = '<!-- START -->\ncontent\n<!-- END -->'
  const matchWithout = blockWithoutName.match(withoutTransform.blockPattern)
  assert.ok(matchWithout, 'should match block without transform name when allowMissingTransforms=true')
})

test('getBlockRegex - yaml syntax produces valid patterns', () => {
  const result = getBlockRegex({
    openText: 'YAML:START',
    closeText: 'YAML:END',
    syntax: 'yaml'
  })

  assert.ok(result.blockPattern instanceof RegExp)
})

test('getBlockRegex - sql syntax produces valid patterns', () => {
  const result = getBlockRegex({
    openText: 'SQL:START',
    closeText: 'SQL:END',
    syntax: 'sql'
  })

  assert.ok(result.blockPattern instanceof RegExp)
})

test('getBlockRegex - toml syntax produces valid patterns', () => {
  const result = getBlockRegex({
    openText: 'TOML:START',
    closeText: 'TOML:END',
    syntax: 'toml'
  })

  assert.ok(result.blockPattern instanceof RegExp)
})

test('getBlockRegex - patterns have global flag', () => {
  const { blockPattern, openPattern, closePattern } = getBlockRegex({
    openText: 'START',
    closeText: 'END',
    syntax: 'md'
  })

  assert.ok(blockPattern.flags.includes('g'), 'blockPattern should have global flag')
  assert.ok(openPattern.flags.includes('g'), 'openPattern should have global flag')
  assert.ok(closePattern.flags.includes('g'), 'closePattern should have global flag')
})

test('getBlockRegex - patterns are case insensitive', () => {
  const { blockPattern } = getBlockRegex({
    openText: 'START',
    closeText: 'END',
    syntax: 'md'
  })

  assert.ok(blockPattern.flags.includes('i'), 'blockPattern should be case insensitive')
})

test.run()
