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
    firstArgIsType: true,
  })

  /*
  deepLog(blocks.blocks)
  /** */
  
  assert.equal(normalizeBlocks(blocks.blocks), normalizeBlocks([
    {
      type: 'a',
      index: 1,
      lines: [ 3, 5 ],
      position: [ 25, 85 ],
      options: {},
      optionsStr: '',
      context: { isMultiline: true },
      open: { 
        start: 25, 
        end: 41, 
        match: '# GENERATED a #\n', 
        value: '# GENERATED a #\n',
        indent: 0
      },
      content: {
        start: 41,
        end: 67,
        indent: 0,
        match: '# This is a comment inside',
        value: '# This is a comment inside'
      },
      close: { 
        start: 67, 
        end: 85, 
        match: '\n# END-GENERATED #', 
        value: '\n# END-GENERATED #',
        indent: 0
      },
      block: {
        start: 25,
        end: 85,
        indent: 0,
        match: '# GENERATED a #\n# This is a comment inside\n# END-GENERATED #',
        value: '# GENERATED a #\n# This is a comment inside\n# END-GENERATED #'
      }
    },
    {
      type: 'b',
      index: 2,
      lines: [ 7, 9 ],
      position: [ 87, 144 ],
      options: {},
      optionsStr: '',
      context: { isMultiline: true },
      open: { 
        start: 87, 
        end: 103, 
        match: '# GENERATED b #\n', 
        value: '# GENERATED b #\n',
        indent: 0
      },
      content: {
        start: 103,
        end: 126,
        indent: 0,
        match: '# Another comment block',
        value: '# Another comment block'
      },
      close: { 
        start: 126, 
        end: 144, 
        match: '\n# END-GENERATED #', 
        value: '\n# END-GENERATED #',
        indent: 0
      },
      block: {
        start: 87,
        end: 144,
        indent: 0,
        match: '# GENERATED b #\n# Another comment block\n# END-GENERATED #',
        value: '# GENERATED b #\n# Another comment block\n# END-GENERATED #'
      }
    },
    {
      type: 'c',
      index: 3,
      lines: [ 11, 14 ],
      position: [ 146, 207 ],
      options: {},
      optionsStr: '',
      context: { isMultiline: true },
      open: { 
        start: 146, 
        end: 162, 
        match: '# GENERATED c #\n', 
        value: '# GENERATED c #\n',
        indent: 0
      },
      content: {
        start: 162,
        end: 189,
        indent: 0,
        match: '# Multiline\n# comment block',
        value: '# Multiline\n# comment block'
      },
      close: { 
        start: 189, 
        end: 207, 
        match: '\n# END-GENERATED #', 
        value: '\n# END-GENERATED #',
        indent: 0
      },
      block: {
        start: 146,
        end: 207,
        indent: 0,
        match: '# GENERATED c #\n# Multiline\n# comment block\n# END-GENERATED #',
        value: '# GENERATED c #\n# Multiline\n# comment block\n# END-GENERATED #'
      }
    },
    {
      type: 'MyCodeGen',
      index: 4,
      lines: [ 16, 19 ],
      position: [ 210, 286 ],
      options: { foo: 'bar' },
      optionsStr: "foo='bar'",
      context: { isMultiline: true },
      open: {
        start: 210,
        end: 244,
        match: "# GENERATED MyCodeGen foo='bar' #\n",
        value: "# GENERATED MyCodeGen foo='bar' #\n",
        indent: 0
      },
      content: {
        start: 244,
        end: 268,
        indent: 0,
        match: '# Comment\nvalue = "test"',
        value: '# Comment\nvalue = "test"'
      },
      close: { 
        start: 268, 
        end: 286, 
        match: '\n# END-GENERATED #', 
        value: '\n# END-GENERATED #',
        indent: 0
      },
      block: {
        start: 210,
        end: 286,
        indent: 0,
        match: "# GENERATED MyCodeGen foo='bar' #\n" +
          '# Comment\n' +
          'value = "test"\n' +
          '# END-GENERATED #',
        value: "# GENERATED MyCodeGen foo='bar' #\n" +
          '# Comment\n' +
          'value = "test"\n' +
          '# END-GENERATED #'
      }
    }])
  )
})

test.run() 