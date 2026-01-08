// Integration tests for CLI
const { test } = require('uvu')
const assert = require('uvu/assert')
const { execSync } = require('child_process')
const path = require('path')

const CLI_PATH = path.join(__dirname, '../cli.js')

function runCli(args = '', input = '') {
  const cmd = `node ${CLI_PATH} ${args}`
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      input: input || undefined,
      timeout: 5000,
    })
    return JSON.parse(result)
  } catch (err) {
    if (err.stdout) {
      return JSON.parse(err.stdout)
    }
    throw err
  }
}

function runCliRaw(args = '', input = '') {
  const cmd = `node ${CLI_PATH} ${args}`
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      input: input || undefined,
      timeout: 5000,
    })
  } catch (err) {
    return err.stderr || err.message
  }
}

const BLOCK_CONTENT = `<!-- block enabled -->
content here
<!-- /block -->`

const AUTO_CONTENT = `<!-- auto isCool optionOne=foo -->
content here
<!-- /auto -->`

/* Pipe input tests */

test('cli - pipe input with default block/block', () => {
  const result = runCli('', BLOCK_CONTENT)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, undefined)
  assert.equal(result.blocks[0].options, { enabled: true })
})

test('cli - pipe input with match word arg', () => {
  const result = runCli('auto', AUTO_CONTENT)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, undefined)
  assert.equal(result.blocks[0].options, { isCool: true, optionOne: 'foo' })
})

test('cli - pipe input with --open flag', () => {
  const result = runCli('--open auto', AUTO_CONTENT)
  assert.is(result.blocks.length, 1)
  assert.equal(result.blocks[0].options, { isCool: true, optionOne: 'foo' })
})

test('cli - pipe input with --open and --close flags', () => {
  const content = `<!-- start foo=bar -->
inner
<!-- end -->`
  const result = runCli('--open start --close end', content)
  assert.is(result.blocks.length, 1)
  assert.equal(result.blocks[0].options, { foo: 'bar' })
})

/* Positional arg tests */

test('cli - content as positional arg', () => {
  const result = runCli(`'${BLOCK_CONTENT}'`)
  assert.is(result.blocks.length, 1)
  assert.equal(result.blocks[0].options, { enabled: true })
})

test('cli - match word + content as positional args', () => {
  const result = runCli(`auto '${AUTO_CONTENT}'`)
  assert.is(result.blocks.length, 1)
  assert.equal(result.blocks[0].options, { isCool: true, optionOne: 'foo' })
})

/* Edge cases */

test('cli - single word is treated as match word not content', () => {
  // When only a single word is passed and no pipe, should error (no content)
  const output = runCliRaw('auto')
  assert.ok(output.includes('No input provided'))
})

test('cli - multiline content detected as content not match word', () => {
  const result = runCli(`'${BLOCK_CONTENT}'`)
  assert.is(result.blocks.length, 1)
})

test('cli - content with <!-- detected as content not match word', () => {
  const result = runCli(`'<!-- block foo -->\n<!-- /block -->'`)
  assert.is(result.blocks.length, 1)
})

test('cli - empty blocks array when no matches', () => {
  const result = runCli('', 'no blocks here')
  assert.is(result.blocks.length, 0)
})

test('cli - multiple blocks parsed', () => {
  const content = `<!-- block one -->first<!-- /block -->
<!-- block two -->second<!-- /block -->`
  const result = runCli('', content)
  assert.is(result.blocks.length, 2)
  assert.equal(result.blocks[0].options, { one: true })
  assert.equal(result.blocks[1].options, { two: true })
})

/* Help and version */

test('cli - --help returns usage info', () => {
  const output = runCliRaw('--help')
  assert.ok(output.includes('Usage:'))
  assert.ok(output.includes('--open'))
  assert.ok(output.includes('Examples:'))
})

test('cli - --version returns version', () => {
  const output = runCliRaw('--version')
  assert.ok(output.includes('comment-block-parser'))
})

/* File path tests */

test('cli - file path as positional arg', () => {
  const result = runCli('--syntax js --open GENERATED --close END-GENERATED test/fixtures/simple.js')
  assert.is(result.blocks.length, 6)
  assert.equal(result.blocks[0].options, { a: true })
})

test('cli - match word + file path', () => {
  const result = runCli('--syntax js --close END-GENERATED GENERATED test/fixtures/simple.js')
  assert.is(result.blocks.length, 6)
})

test('cli - piped file path', () => {
  const result = runCli('--syntax js --open GENERATED --close END-GENERATED', 'test/fixtures/simple.js')
  assert.is(result.blocks.length, 6)
})

test('cli - file path not treated as match word', () => {
  // File path should be read, not treated as match word
  const result = runCli('--syntax js --open GENERATED --close END-GENERATED ./test/fixtures/simple.js')
  assert.is(result.blocks.length, 6)
})

test('cli - nonexistent file treated as content if looks like content', () => {
  // This has <!-- so it's treated as content, not a file path
  const result = runCli('', '<!-- block foo -->\ncontent\n<!-- /block -->')
  assert.is(result.blocks.length, 1)
})

test.run()
