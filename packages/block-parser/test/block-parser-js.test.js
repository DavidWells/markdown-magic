const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../src/index')
const { deepLog } = require('./logs')

test('JS file parse',async () => {
  const contents = await fs.readFile(path.join(__dirname,'./fixtures/simple.js'),'utf8')
  const blocks = parseBlocks(contents,{
    syntax: 'js',
    open: 'GENERATED',
    close: 'END-GENERATED',
  })
  //*
  deepLog(blocks.blocks)
  /** */
  assert.equal(blocks.blocks,[
  {
    type: 'a',
    index: 1,
    lines: [ 7,9 ],
    position: [ 96,154 ],
    options: {},
    optionsStr: '',
    context: { isMultiline: true },
    open: { 
      start: 96,
      end: 117,
      match: '/* ⛔️ GENERATED a */\n',
      value: '/* ⛔️ GENERATED a */\n',
      indent: 0
    },
    content: {
      start: 117,
      end: 134,
      indent: 0,
      match: '// comment inside',
      value: '// comment inside'
    },
    close: { 
      start: 134,
      end: 154,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 96,
      end: 154,
      indent: 0,
      match: '/* ⛔️ GENERATED a */\n// comment inside\n/* END-GENERATED */',
      value: '/* ⛔️ GENERATED a */\n// comment inside\n/* END-GENERATED */'
    }
  },
  {
    type: 'b',
    index: 2,
    lines: [ 11,13 ],
    position: [ 156,214 ],
    options: {},
    optionsStr: '',
    context: { isMultiline: true },
    open: { 
      start: 156,
      end: 174,
      match: '/* GENERATED b */\n',
      value: '/* GENERATED b */\n',
      indent: 0
    },
    content: {
      start: 174,
      end: 194,
      indent: 0,
      match: '/* comment inside */',
      value: '/* comment inside */'
    },
    close: { 
      start: 194,
      end: 214,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 156,
      end: 214,
      indent: 0,
      match: '/* GENERATED b */\n/* comment inside */\n/* END-GENERATED */',
      value: '/* GENERATED b */\n/* comment inside */\n/* END-GENERATED */'
    }
  },
  {
    type: 'c',
    index: 3,
    lines: [ 15,19 ],
    position: [ 216,278 ],
    options: {},
    optionsStr: '',
    context: { isMultiline: true },
    open: { 
      start: 216,
      end: 234,
      match: '/* GENERATED c */\n',
      value: '/* GENERATED c */\n',
      indent: 0
    },
    content: {
      start: 234,
      end: 258,
      indent: 0,
      match: '/* \n  comment inside \n*/',
      value: '/* \n  comment inside \n*/'
    },
    close: { 
      start: 258,
      end: 278,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 216,
      end: 278,
      indent: 0,
      match: '/* GENERATED c */\n/* \n  comment inside \n*/\n/* END-GENERATED */',
      value: '/* GENERATED c */\n/* \n  comment inside \n*/\n/* END-GENERATED */'
    }
  },
  {
    type: 'd',
    index: 4,
    lines: [ 21,25 ],
    position: [ 280,344 ],
    options: {},
    optionsStr: '',
    context: { isMultiline: true },
    open: { 
      start: 280,
      end: 298,
      match: '/* GENERATED d */\n',
      value: '/* GENERATED d */\n',
      indent: 0
    },
    content: {
      start: 298,
      end: 324,
      indent: 0,
      match: '/**\n * comment inside \n */',
      value: '/**\n * comment inside \n */'
    },
    close: { 
      start: 324,
      end: 344,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 280,
      end: 344,
      indent: 0,
      match: '/* GENERATED d */\n/**\n * comment inside \n */\n/* END-GENERATED */',
      value: '/* GENERATED d */\n/**\n * comment inside \n */\n/* END-GENERATED */'
    }
  },
  {
    type: 'e',
    index: 5,
    lines: [ 27,31 ],
    position: [ 346,438 ],
    options: {},
    optionsStr: '',
    context: { isMultiline: true },
    open: { 
      start: 346,
      end: 364,
      match: '/* GENERATED e */\n',
      value: '/* GENERATED e */\n',
      indent: 0
    },
    content: {
      start: 364,
      end: 418,
      indent: 0,
      match: '/****************\n comment inside \n******************/',
      value: '/****************\n comment inside \n******************/'
    },
    close: { 
      start: 418,
      end: 438,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 346,
      end: 438,
      indent: 0,
      match: '/* GENERATED e */\n' +
        '/****************\n' +
        ' comment inside \n' +
        '******************/\n' +
        '/* END-GENERATED */',
      value: '/* GENERATED e */\n' +
        '/****************\n' +
        ' comment inside \n' +
        '******************/\n' +
        '/* END-GENERATED */'
    }
  },
  {
    type: 'MyCodeGen',
    index: 6,
    lines: [ 35,38 ],
    position: [ 455,546 ],
    options: { yay: 'nice' },
    optionsStr: "yay='nice'",
    context: { isMultiline: true },
    open: {
      start: 455,
      end: 492,
      match: "/* GENERATED MyCodeGen yay='nice' */\n",
      value: "/* GENERATED MyCodeGen yay='nice' */\n",
      indent: 0
    },
    content: {
      start: 492,
      end: 526,
      indent: 0,
      match: "/* Awesome */\nconsole.log('noooo')",
      value: "/* Awesome */\nconsole.log('noooo')"
    },
    close: { 
      start: 526,
      end: 546,
      match: '\n/* END-GENERATED */',
      value: '\n/* END-GENERATED */',
      indent: 0
    },
    block: {
      start: 455,
      end: 546,
      indent: 0,
      match: "/* GENERATED MyCodeGen yay='nice' */\n" +
        '/* Awesome */\n' +
        "console.log('noooo')\n" +
        '/* END-GENERATED */',
      value: "/* GENERATED MyCodeGen yay='nice' */\n" +
        '/* Awesome */\n' +
        "console.log('noooo')\n" +
        '/* END-GENERATED */'
    }
  }
])
})

test.run()