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
  const result = runCli('--parseType --open GENERATED --close END-GENERATED test/fixtures/custom-match-blocks.js')
  assert.is(result.blocks.length, 6)
  assert.equal(result.blocks[0].options, {})
  assert.is(result.blocks[0].type, 'a')
})

test('cli - match word + file path', () => {
  const result = runCli('--parseType --close END-GENERATED GENERATED test/fixtures/custom-match-blocks.js')
  assert.is(result.blocks.length, 6)
})

test('cli - piped file path', () => {
  const result = runCli('--parseType --open GENERATED --close END-GENERATED', 'test/fixtures/custom-match-blocks.js')
  assert.is(result.blocks.length, 6)
})

test('cli - file path not treated as match word', () => {
  // File path should be read, not treated as match word
  const result = runCli('--parseType --open GENERATED --close END-GENERATED ./test/fixtures/custom-match-blocks.js')
  assert.is(result.blocks.length, 6)
})

test('cli - nonexistent file treated as content if looks like content', () => {
  // This has <!-- so it's treated as content, not a file path
  const result = runCli('', '<!-- block foo -->\ncontent\n<!-- /block -->')
  assert.is(result.blocks.length, 1)
})

/* Pattern mode tests (--open without --close) */

test('cli - pattern mode with single component', () => {
  const content = `/* MyComp foo='bar' */\ncontent here\n/* /MyComp */`
  const result = runCli('--open MyComp --syntax js', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'MyComp')
  assert.equal(result.blocks[0].options, { foo: 'bar' })
})

test('cli - pattern mode with OR pattern', () => {
  const content = `/* CompA a=1 */\nA content\n/* /CompA */\n/* CompB b=2 */\nB content\n/* /CompB */`
  const result = runCli('--open "CompA|CompB" --syntax js', content)
  assert.is(result.blocks.length, 2)
  assert.is(result.blocks[0].type, 'CompA')
  assert.is(result.blocks[1].type, 'CompB')
})

test('cli - pattern mode close must match open', () => {
  const content = `/* CompA */\ncontent\n/* /CompB */`
  const result = runCli('--open "CompA|CompB" --syntax js', content)
  assert.is(result.blocks.length, 0)
})

test('cli - pattern mode with markdown syntax', () => {
  const content = `<!-- Widget name="test" -->\nwidget content\n<!-- /Widget -->`
  const result = runCli('--open Widget', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'Widget')
  assert.equal(result.blocks[0].options, { name: 'test' })
})

/* Regex literal string tests */

test('cli - regex literal string as open pattern', () => {
  const content = `/* CompA a=1 */\ncontent A\n/* /CompA */`
  const result = runCli('--open "/CompA/" --syntax js', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'CompA')
})

test('cli - regex literal OR pattern', () => {
  const content = `/* CompA a=1 */\nA\n/* /CompA */\n/* CompB b=2 */\nB\n/* /CompB */`
  const result = runCli('--open "/CompA|CompB/" --syntax js', content)
  assert.is(result.blocks.length, 2)
  assert.is(result.blocks[0].type, 'CompA')
  assert.is(result.blocks[1].type, 'CompB')
})

test('cli - regex literal not treated as file path', () => {
  const content = `/* Widget foo=bar */\ncontent\n/* /Widget */`
  const result = runCli('--open "/Widget/" --syntax js', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'Widget')
})

test('cli - regex literal as positional arg triggers pattern mode', () => {
  const content = `<!-- auto foo=bar -->\ncontent\n<!-- /auto -->`
  const result = runCli("'/auto/'", content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'auto')
  assert.equal(result.blocks[0].options, { foo: 'bar' })
})

/* Single comment mode tests (--no-close) */

test('cli - --no-close matches single comments', () => {
  const content = `<!-- config debug=true -->\nsome content\n<!-- other stuff -->`
  const result = runCli('--no-close --open config', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'config')
  assert.equal(result.blocks[0].options, { debug: true })
})

test('cli - --no-close with match word', () => {
  const content = `<!-- widget id="one" -->\nstuff\n<!-- widget id="two" -->`
  const result = runCli('--no-close widget', content)
  assert.is(result.blocks.length, 2)
  assert.equal(result.blocks[0].options, { id: 'one' })
  assert.equal(result.blocks[1].options, { id: 'two' })
})

test('cli - --no-close with pattern', () => {
  const content = `<!-- header title="Hi" -->\n<!-- footer year="2024" -->`
  const result = runCli('--no-close --open "header|footer"', content)
  assert.is(result.blocks.length, 2)
  assert.is(result.blocks[0].type, 'header')
  assert.is(result.blocks[1].type, 'footer')
})

test('cli - --close false works same as --no-close', () => {
  const content = `<!-- config debug=true -->\nsome content`
  const result = runCli('--close false --open config', content)
  assert.is(result.blocks.length, 1)
  assert.is(result.blocks[0].type, 'config')
  assert.equal(result.blocks[0].options, { debug: true })
})

test.run()
