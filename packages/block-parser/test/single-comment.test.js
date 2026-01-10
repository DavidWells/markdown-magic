// Tests for single comment matching (close: false)
const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')

test('single comment - basic match', () => {
  const content = `<!-- config debug=true -->
some content here
<!-- other stuff -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: 'config',
    close: false
  })

  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'config')
  assert.equal(result.blocks[0].options, { debug: true })
})

test('single comment - multiple matches', () => {
  const content = `<!-- widget id="one" -->
some stuff
<!-- widget id="two" -->
more stuff
<!-- widget id="three" -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: 'widget',
    close: false
  })

  console.log(result.blocks)

  assert.is(result.blocks.length, 3)
  assert.equal(result.blocks[0].options, { id: 'one' })
  assert.equal(result.blocks[1].options, { id: 'two' })
  assert.equal(result.blocks[2].options, { id: 'three' })
})

test('single comment - pattern matching multiple types', () => {
  const content = `<!-- header title="Hello" -->
content
<!-- footer year="2024" -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: 'header|footer',
    close: false
  })

  assert.is(result.blocks.length, 2)
  assert.is(result.blocks[0].type, 'header')
  assert.equal(result.blocks[0].options, { title: 'Hello' })
  assert.is(result.blocks[1].type, 'footer')
  assert.equal(result.blocks[1].options, { year: '2024' })
})

test('single comment - js syntax', () => {
  const content = `/* config env="prod" */
const x = 1
/* config env="dev" */`

  const result = parseBlocks(content, {
    syntax: 'js',
    open: 'config',
    close: false
  })

  assert.is(result.blocks.length, 2)
  assert.equal(result.blocks[0].options, { env: 'prod' })
  assert.equal(result.blocks[1].options, { env: 'dev' })
})

test('single comment - no content field in result', () => {
  const content = `<!-- marker foo=bar -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: 'marker',
    close: false
  })

  assert.is(result.blocks.length, 1)
  // Content should be empty/undefined for single comments
  assert.is(result.blocks[0].content.value, '')
})

test('single comment - regex literal pattern', () => {
  const content = `<!-- Gen_Users enabled -->
<!-- Gen_Products disabled -->`

  const result = parseBlocks(content, {
    syntax: 'md',
    open: '/Gen_[A-Za-z]+/',
    close: false
  })

  assert.is(result.blocks.length, 2)
  assert.is(result.blocks[0].type, 'Gen_Users')
  assert.is(result.blocks[1].type, 'Gen_Products')
})

test.run()
