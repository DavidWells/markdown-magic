const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks, replaceContent } = require('./new-parser')

const defaultOpts = {
  syntax: 'md',
  open: 'DOCS:START',
  close: 'DOCS:END',
}

test('Returns empty array', () => {
  assert.equal(parseBlocks('', defaultOpts).transforms, [])
  assert.equal(parseBlocks(' ', defaultOpts).transforms, [])
  assert.equal(parseBlocks(`
  
  
  `, defaultOpts).transforms, [])
  assert.equal(parseBlocks(`
# No block in here

nope  
  `, defaultOpts).transforms, [])
})

const md = `
Very nice

<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>
ok
<!-- DOCS:END -->`

test('Parse md blocks', () => {
  const parsedValue = parseBlocks(md, defaultOpts)
  console.log('parsedValue', parsedValue)
  assert.equal(parsedValue.transforms, [
    {
      transform: 'TOC',
      args: { foo: { rad: 'orange' } },
      block: {
        indentation: '',
        start: 12,
        end: 85,
        contentStart: 64,
        contentEnd: 68,
        contentIndent: 0,
        openTag: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n",
        content: 'ok',
        closeTag: '\n<!-- DOCS:END -->'
      },
      raw: {
        transform: '(TOC)',
        args: "foo={{ rad: 'orange' }} ----",
        content: '\nok\n',
        block: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n" +
          'ok\n' +
          '<!-- DOCS:END -->'
      },
      meta: { isMultiline: true }
    }
  ], '')
})

test.run()