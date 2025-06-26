const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')
const { normalizeBlocks } = require('./utils')

test('TOML file parse', async () => {
  const contents = await fs.readFile(path.join(__dirname, './fixtures/simple.toml'), 'utf8')
  const blocks = parseBlocks(contents, {
    syntax: 'toml',
    open: 'GENERATED',
    close: 'END-GENERATED',
  })

  /*
  deepLog(blocks.blocks)
  /** */
  
  assert.equal(normalizeBlocks(blocks.blocks), normalizeBlocks([
    {
      index: 1,
      type: 'a',
      options: {},
      context: { isMultiline: true },
      open: { value: '# GENERATED a #\n', start: 25, end: 41 },
      content: {
        value: '# This is a comment inside',
        start: 41,
        end: 67,
        indentation: 0
      },
      close: { value: '\n# END-GENERATED #', start: 67, end: 85 },
      block: {
        indentation: 0,
        lines: [ 3, 5 ],
        start: 25,
        end: 85,
        rawArgs: '',
        rawContent: '# This is a comment inside',
        value: '# GENERATED a #\n# This is a comment inside\n# END-GENERATED #'
      }
    },
    {
      index: 2,
      type: 'b',
      options: {},
      context: { isMultiline: true },
      open: { value: '# GENERATED b #\n', start: 87, end: 103 },
      content: {
        value: '# Another comment block',
        start: 103,
        end: 126,
        indentation: 0
      },
      close: { value: '\n# END-GENERATED #', start: 126, end: 144 },
      block: {
        indentation: 0,
        lines: [ 7, 9 ],
        start: 87,
        end: 144,
        rawArgs: '',
        rawContent: '# Another comment block',
        value: '# GENERATED b #\n# Another comment block\n# END-GENERATED #'
      }
    },
    {
      index: 3,
      type: 'c',
      options: {},
      context: { isMultiline: true },
      open: { value: '# GENERATED c #\n', start: 146, end: 162 },
      content: {
        value: '# Multiline\n# comment block',
        start: 162,
        end: 189,
        indentation: 0
      },
      close: { value: '\n# END-GENERATED #', start: 189, end: 207 },
      block: {
        indentation: 0,
        lines: [ 11, 14 ],
        start: 146,
        end: 207,
        rawArgs: '',
        rawContent: '# Multiline\n# comment block',
        value: '# GENERATED c #\n# Multiline\n# comment block\n# END-GENERATED #'
      }
    },
    {
      index: 4,
      type: 'MyCodeGen',
      options: { foo: 'bar' },
      context: { isMultiline: true },
      open: {
        value: "# GENERATED MyCodeGen foo='bar' #\n",
        start: 210,
        end: 244
      },
      content: {
        value: '# Comment\nvalue = "test"',
      },
      close: { value: '\n# END-GENERATED #', start: 268, end: 286 },
      block: {
        indentation: 0,
        rawArgs: "foo='bar'",
        rawContent: '# Comment\nvalue = "test"',
        value: "# GENERATED MyCodeGen foo='bar' #\n" +
          '# Comment\n' +
          'value = "test"\n' +
          '# END-GENERATED #'
      }
    }])
  )
})

test.run() 