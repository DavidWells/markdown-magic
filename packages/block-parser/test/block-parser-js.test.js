const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')

test('JS file parse', async () => {
  const contents = await fs.readFile(path.join(__dirname, './fixtures/simple.js'), 'utf8')
  const blocks = parseBlocks(contents, {
    syntax: 'js',
    open: 'GENERATED',
    close: 'END-GENERATED',
  })
  //*
  // deepLog(blocks.blocks)
  /** */
  assert.equal(blocks.blocks, [
  {
    index: 1,
    type: 'a',
    options: {},
    context: { isMultiline: true },
    open: { value: '/* ⛔️ GENERATED a */\n', start: 96, end: 117 },
    content: {
      value: '// comment inside',
      rawValue: '// comment inside',
      start: 117,
      end: 134,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 134, end: 154 },
    block: {
      indentation: '',
      lines: [ 7, 9 ],
      start: 96,
      end: 154,
      rawArgs: '',
      rawContent: '// comment inside',
      value: '/* ⛔️ GENERATED a */\n// comment inside\n/* END-GENERATED */'
    }
  },
  {
    index: 2,
    type: 'b',
    options: {},
    context: { isMultiline: true },
    open: { value: '/* GENERATED b */\n', start: 156, end: 174 },
    content: {
      value: '/* comment inside */',
      rawValue: '/* comment inside */',
      start: 174,
      end: 194,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 194, end: 214 },
    block: {
      indentation: '',
      lines: [ 11, 13 ],
      start: 156,
      end: 214,
      rawArgs: '',
      rawContent: '/* comment inside */',
      value: '/* GENERATED b */\n/* comment inside */\n/* END-GENERATED */'
    }
  },
  {
    index: 3,
    type: 'c',
    options: {},
    context: { isMultiline: true },
    open: { value: '/* GENERATED c */\n', start: 216, end: 234 },
    content: {
      value: '/* \n  comment inside \n*/',
      rawValue: '/* \n  comment inside \n*/',
      start: 234,
      end: 258,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 258, end: 278 },
    block: {
      indentation: '',
      lines: [ 15, 19 ],
      start: 216,
      end: 278,
      rawArgs: '',
      rawContent: '/* \n  comment inside \n*/',
      value: '/* GENERATED c */\n/* \n  comment inside \n*/\n/* END-GENERATED */'
    }
  },
  {
    index: 4,
    type: 'd',
    options: {},
    context: { isMultiline: true },
    open: { value: '/* GENERATED d */\n', start: 280, end: 298 },
    content: {
      value: '/**\n * comment inside \n */',
      rawValue: '/**\n * comment inside \n */',
      start: 298,
      end: 324,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 324, end: 344 },
    block: {
      indentation: '',
      lines: [ 21, 25 ],
      start: 280,
      end: 344,
      rawArgs: '',
      rawContent: '/**\n * comment inside \n */',
      value: '/* GENERATED d */\n/**\n * comment inside \n */\n/* END-GENERATED */'
    }
  },
  {
    index: 5,
    type: 'e',
    options: {},
    context: { isMultiline: true },
    open: { value: '/* GENERATED e */\n', start: 346, end: 364 },
    content: {
      value: '/****************\n comment inside \n******************/',
      rawValue: '/****************\n comment inside \n******************/',
      start: 364,
      end: 418,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 418, end: 438 },
    block: {
      indentation: '',
      lines: [ 27, 31 ],
      start: 346,
      end: 438,
      rawArgs: '',
      rawContent: '/****************\n comment inside \n******************/',
      value: '/* GENERATED e */\n' +
        '/****************\n' +
        ' comment inside \n' +
        '******************/\n' +
        '/* END-GENERATED */'
    }
  },
  {
    index: 6,
    type: 'MyCodeGen',
    options: { yay: 'nice' },
    context: { isMultiline: true },
    open: {
      value: "/* GENERATED MyCodeGen yay='nice' */\n",
      start: 455,
      end: 492
    },
    content: {
      value: "/* Awesome */\nconsole.log('noooo')",
      rawValue: "/* Awesome */\nconsole.log('noooo')",
      start: 492,
      end: 526,
      indentation: 0
    },
    close: { value: '\n/* END-GENERATED */', start: 526, end: 546 },
    block: {
      indentation: '',
      lines: [ 35, 38 ],
      start: 455,
      end: 546,
      rawArgs: "yay='nice'",
      rawContent: "/* Awesome */\nconsole.log('noooo')",
      value: "/* GENERATED MyCodeGen yay='nice' */\n" +
        '/* Awesome */\n' +
        "console.log('noooo')\n" +
        '/* END-GENERATED */'
    }
  }
])
})

test.run()