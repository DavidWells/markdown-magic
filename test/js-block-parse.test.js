const path = require('path')
const fs = require('fs').promises
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { parseBlocks } = require('../lib/utils/block-parser')
const { deepLog } = require('../lib/utils/logs')

test('JS file parse', async () => {
  const contents = await fs.readFile(path.join(__dirname, 'fixtures/js/simple.js'), 'utf-8')
  const blocks = parseBlocks(contents, {
    syntax: 'js',
    open: 'GENERATED',
    close: 'END-GENERATED',
  })
  deepLog(blocks)
  assert.equal(blocks, {
    pattern: /([ \t]*)(?:\/\*{1,}[\n\*]*(?:.*|\r?|\n?|\s*)GENERATED\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.*|.*\r?\n?)*?)\/\*{1,}[\n\*]*(?:.*|\r?|\n?|\s*)END-GENERATED(?:.|\r?\n)*?\*+\//gim,
    commentOpen: /([ \t]*)(\/\*{1,}[\n\*]*(?:.|\r?|\n?|\s*)\bGENERATED\b)((?:.|\r?\n)*?\*+\/\n?)/gi,
    commentClose: /\*+\/(?:.|\r?\n)*?([ 	]*)((?:\/\*{1,}[\n\*]*(?:.*|\r?\n)(?:.*|\r?\n))*?\bEND-GENERATED\b)((?:.|\r?\n)*?\*+\/)/gi,
    blocks: [
      {
        type: 'a',
        options: {},
        context: { isMultiline: true },
        open: { value: '/* GENERATED a */\n', start: 96, end: 113 },
        content: {
          value: '// comment inside',
          start: 113,
          end: 132,
          indentation: 0
        },
        close: { value: '\n/* END-GENERATED */', start: 132, end: 151 },
        block: {
          indentation: '',
          lines: [ 7, 9 ],
          start: 96,
          end: 151,
          rawType: 'a',
          rawArgs: '',
          rawContent: '\n// comment inside\n',
          value: '/* GENERATED a */\n// comment inside\n/* END-GENERATED */'
        }
      },
      {
        type: 'b',
        options: {},
        context: { isMultiline: true },
        open: { value: '/* GENERATED b */\n', start: 153, end: 170 },
        content: { value: '', start: 170, end: 171, indentation: 0 },
        close: {
          value: '/* comment inside */\n/* END-GENERATED */',
          start: 171,
          end: 211
        },
        block: {
          indentation: '',
          lines: [ 11, 13 ],
          start: 153,
          end: 211,
          rawType: 'b',
          rawArgs: '',
          rawContent: '\n',
          value: '/* GENERATED b */\n/* comment inside */\n/* END-GENERATED */'
        }
      },
      {
        type: 'c',
        options: {},
        context: { isMultiline: true },
        open: { value: '/* GENERATED c */\n', start: 213, end: 230 },
        content: {
          value: '/* \n  comment inside \n*/',
          start: 230,
          end: 256,
          indentation: 0
        },
        close: { value: '\n/* END-GENERATED */', start: 256, end: 275 },
        block: {
          indentation: '',
          lines: [ 15, 19 ],
          start: 213,
          end: 275,
          rawType: 'c',
          rawArgs: '',
          rawContent: '\n/* \n  comment inside \n*/\n',
          value: '/* GENERATED c */\n/* \n  comment inside \n*/\n/* END-GENERATED */'
        }
      },
      {
        type: 'd',
        options: {},
        context: { isMultiline: true },
        open: { value: '/* GENERATED d */\n', start: 277, end: 294 },
        content: {
          value: '/**\n * comment inside \n */',
          start: 294,
          end: 322,
          indentation: 0
        },
        close: { value: '\n/* END-GENERATED */', start: 322, end: 341 },
        block: {
          indentation: '',
          lines: [ 21, 25 ],
          start: 277,
          end: 341,
          rawType: 'd',
          rawArgs: '',
          rawContent: '\n/**\n * comment inside \n */\n',
          value: '/* GENERATED d */\n/**\n * comment inside \n */\n/* END-GENERATED */'
        }
      },
      {
        type: 'e',
        options: {},
        context: { isMultiline: true },
        open: { value: '/* GENERATED e */\n', start: 343, end: 360 },
        content: {
          value: '/****************\n comment inside \n******************/',
          start: 360,
          end: 416,
          indentation: 0
        },
        close: { value: '\n/* END-GENERATED */', start: 416, end: 435 },
        block: {
          indentation: '',
          lines: [ 27, 31 ],
          start: 343,
          end: 435,
          rawType: 'e',
          rawArgs: '',
          rawContent: '\n/****************\n comment inside \n******************/\n',
          value: '/* GENERATED e */\n' +
            '/****************\n' +
            ' comment inside \n' +
            '******************/\n' +
            '/* END-GENERATED */'
        }
      },
      {
        type: 'MyCodeGen',
        options: { yay: 'nice' },
        context: { isMultiline: true },
        open: {
          value: "/* GENERATED MyCodeGen yay='nice' */\n",
          start: 452,
          end: 488
        },
        content: {
          value: "/* Awesome */\nconsole.log('noooo')",
          start: 488,
          end: 524,
          indentation: 0
        },
        close: { value: '\n/* END-GENERATED */', start: 524, end: 543 },
        block: {
          indentation: '',
          lines: [ 35, 38 ],
          start: 452,
          end: 543,
          rawType: 'MyCodeGen',
          rawArgs: "yay='nice'",
          rawContent: "\n/* Awesome */\nconsole.log('noooo')\n",
          value: "/* GENERATED MyCodeGen yay='nice' */\n" +
            '/* Awesome */\n' +
            "console.log('noooo')\n" +
            '/* END-GENERATED */'
        }
      }
    ]
  })
})

test.run()