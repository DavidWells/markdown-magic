const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')
const { normalizeBlocks } = require('./utils')

test('SQL file parse', async () => {
  const contents = await fs.readFile(path.join(__dirname, './fixtures/simple.sql'), 'utf-8')
  const blocks = parseBlocks(contents, {
    syntax: 'sql',
    open: 'GENERATED',
    close: 'END-GENERATED',
  })
  /*
  deepLog(blocks.blocks)
  /** */
  assert.equal(normalizeBlocks(blocks.blocks), [
    {
      index: 1,
      type: 'a',
      options: {},
      openValue: '/* GENERATED a */\n',
      contentValue: '-- This is a comment inside',
      closeValue: '\n/* END-GENERATED */',
      rawArgs: '',
      rawContent: '-- This is a comment inside',
      blockValue: '/* GENERATED a */\n-- This is a comment inside\n/* END-GENERATED */'
    },
    {
      index: 2,
      type: 'b',
      options: {},
      openValue: '/* GENERATED b */\n',
      contentValue: '-- Another comment block',
      closeValue: '\n/* END-GENERATED */',
      rawArgs: '',
      rawContent: '-- Another comment block',
      blockValue: '/* GENERATED b */\n-- Another comment block\n/* END-GENERATED */'
    },
    {
      index: 3,
      type: 'c',
      options: {},
      openValue: '/* GENERATED c */\n',
      contentValue: '-- Multiline\n-- comment block',
      closeValue: '\n/* END-GENERATED */',
      rawArgs: '',
      rawContent: '-- Multiline\n-- comment block',
      blockValue: '/* GENERATED c */\n-- Multiline\n-- comment block\n/* END-GENERATED */'
    },
    {
      index: 4,
      type: 'MyCodeGen',
      options: { foo: 'bar' },
      openValue: "/* GENERATED MyCodeGen foo='bar' */\n",
      contentValue: '-- Generated content\nSELECT * FROM users WHERE id = 1;',
      closeValue: '\n/* END-GENERATED */',
      rawArgs: "foo='bar'",
      rawContent: '-- Generated content\nSELECT * FROM users WHERE id = 1;',
      blockValue: "/* GENERATED MyCodeGen foo='bar' */\n-- Generated content\nSELECT * FROM users WHERE id = 1;\n/* END-GENERATED */"
    }
  ])
})

test.run() 