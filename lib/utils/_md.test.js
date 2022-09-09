const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('./block-parser')
const { deepLog } = require('./logs')

const defaultOpts = {
  syntax: 'md',
  open: 'DOCS:START',
  close: 'DOCS:END',
}

test('Returns empty array', () => {
  assert.equal(parseBlocks('', defaultOpts).blocks, [])
  assert.equal(parseBlocks(' ', defaultOpts).blocks, [])
  assert.equal(parseBlocks(`
  
  
  `, defaultOpts).blocks, [])
  assert.equal(parseBlocks(`
# No block in here

nope  
  `, defaultOpts).blocks, [])
})

const md = `
Very nice

<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>
ok
<!-- DOCS:END -->`

test.only('Parse md blocks', () => {
  const parsedValue = parseBlocks(md, defaultOpts)
  deepLog(parsedValue)
  assert.equal(parsedValue.blocks,  [
    {
      type: 'TOC',
      options: { foo: { rad: 'orange' } },
      context: { isMultiline: true },
      open: {
        value: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n",
        start: 12,
        end: 64
      },
      content: { value: 'ok', start: 64, end: 68, indentation: 0 },
      close: { value: '\n<!-- DOCS:END -->', start: 68, end: 85 },
      block: {
        indentation: '',
        lines: [ 4, 6 ],
        start: 12,
        end: 85,
        rawType: '(TOC)',
        rawArgs: "foo={{ rad: 'orange' }}",
        rawContent: '\nok\n',
        value: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n" +
          'ok\n' +
          '<!-- DOCS:END -->'
      }
    }
  ], 'Array contains details')
})

test.run()