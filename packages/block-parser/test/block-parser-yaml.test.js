const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')
const { normalizeBlocks } = require('./utils')

test('YAML file parse', async () => {
  const contents = await fs.readFile(path.join(__dirname, './fixtures/simple.yaml'), 'utf-8')
  const blocks = parseBlocks(contents, {
    syntax: 'yaml',
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
      openValue: '## GENERATED a ##\n',
      contentValue: '# comment inside',
      closeValue: '\n## END-GENERATED ##',
      rawArgs: '',
      rawContent: '# comment inside',
      blockValue: '## GENERATED a ##\n# comment inside\n## END-GENERATED ##'
    },
    {
      index: 2,
      type: 'b',
      options: {},
      openValue: '## GENERATED b ##\n',
      contentValue: '# another comment',
      closeValue: '\n## END-GENERATED ##',
      rawArgs: '',
      rawContent: '# another comment',
      blockValue: '## GENERATED b ##\n# another comment\n## END-GENERATED ##'
    },
    {
      index: 3,
      type: 'c',
      options: {},
      openValue: '## GENERATED c ##\n',
      contentValue: '# multiline\n# comment block',
      closeValue: '\n## END-GENERATED ##',
      rawArgs: '',
      rawContent: '# multiline\n# comment block',
      blockValue: '## GENERATED c ##\n# multiline\n# comment block\n## END-GENERATED ##'
    },
    {
      index: 4,
      type: 'MyCodeGen',
      options: { foo: 'bar' },
      openValue: "## GENERATED MyCodeGen foo='bar' ##\n",
      contentValue: '# Generated content\nvalue: test',
      closeValue: '\n## END-GENERATED ##',
      rawArgs: "foo='bar'",
      rawContent: '# Generated content\nvalue: test',
      blockValue: "## GENERATED MyCodeGen foo='bar' ##\n# Generated content\nvalue: test\n## END-GENERATED ##"
    }
  ])
})

test.run()