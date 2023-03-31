const { test } = require('uvu') 
const assert = require('uvu/assert')
const { deepLog } = require('./utils/logs')
const { getGlobGroupsFromArgs, runCli } = require('./cli')

const DEBUG = true
const logger = (DEBUG) ? console.log : () => {}
const deepLogger = (DEBUG) ? deepLog : () => {}

function logInput(rawArgs) {
  logger('\n───────────────────────')
  logger('Input:')
  logger(rawArgs.join(" "))
  logger('───────────────────────\n')
}

test('Exports API', () => {
  assert.equal(typeof runCli, 'function', 'undefined val')
  assert.equal(typeof getGlobGroupsFromArgs, 'function', 'undefined val')
})

const longArgs = [
  'test/fixtures/md/basic.md',
  'test/fixtures/md/error-missing-transforms-two.md',
  'test/fixtures/md/error-missing-transforms.md',
  'test/fixtures/md/error-no-block-transform-defined.md',
  'test/fixtures/md/error-unbalanced.md',
  'test/fixtures/md/format-inline.md',
  'test/fixtures/md/format-with-wacky-indentation.md',
  'test/fixtures/md/inline-two.md',
  'test/fixtures/md/inline.md',
  'test/fixtures/md/missing-transform.md',
  'test/fixtures/md/mixed.md',
  'test/fixtures/md/no-transforms.md',
  'test/fixtures/md/string.md',
  'test/fixtures/md/syntax-legacy-colon.md',
  'test/fixtures/md/syntax-legacy-query.md',
  'test/fixtures/md/transform-code.md',
  'test/fixtures/md/transform-custom.md',
  'test/fixtures/md/transform-file.md',
  'test/fixtures/md/transform-remote.md',
  'test/fixtures/md/transform-toc.md',
  'test/fixtures/md/transform-wordCount.md',
  'debug',
  '--transform',
  'test/fixtures/md/transform-code.md',
  'test/fixtures/md/transform-custom.md',
  'test/fixtures/md/transform-file.md',
  'test/fixtures/md/transform-remote.md',
  'test/fixtures/md/transform-toc.md',
  'test/fixtures/md/transform-wordCount.md',
  '1233535235',
  '=',
  'hahah',
  'funky=hi',
  '--ignore',
  'test/fixtures/output/basic.md',
  'test/fixtures/output/block-no-transform.md',
  'test/fixtures/output/error-missing-transforms-two.md',
  'test/fixtures/output/error-missing-transforms.md',
  'test/fixtures/output/fixture-code.md',
  'test/fixtures/output/format-inline.md',
  'test/fixtures/output/format-with-wacky-indentation.md',
  'test/fixtures/output/go-simple.md',
  'test/fixtures/output/inline-two.md',
  'test/fixtures/output/inline.md',
  'test/fixtures/output/missing-transform.md',
  'test/fixtures/output/mixed.md',
  'test/fixtures/output/params.md',
  'test/fixtures/output/remote.md',
  'test/fixtures/output/toc.md',
  'test/fixtures/output/transform-code.md',
  'test/fixtures/output/transform-custom.md',
  'test/fixtures/output/transform-file.md',
  'test/fixtures/output/transform-remote.md',
  'test/fixtures/output/transform-toc.md',
  'test/fixtures/output/transform-wordCount.md',
  'test/fixtures/output/with-wacky-indentation.md',
  '--lol',
  '--whatever',
  'test/fixtures/md/syntax-legacy-colon.md',
  'test/fixtures/md/syntax-legacy-query.md',
  '--foo=bar',
  '--fun',
  'lol.md',
  'what=no.md',
  'x',
  'xno.md',
  'what'
]

test('getGlobGroupsFromArgs returns globs', () => {
  /* CLI command with list of files already passed in
node ./cli.js test/fixtures/md/**.md debug --transform test/fixtures/md/transform-**.md 1233535235 = hahah funky=hi --ignore test/fixtures/output/**.md --lol --whatever test/fixtures/md/syntax-**.md --foo=bar --fun lol.md what=no.md x 'xno.md' what
  */
  const globData = getGlobGroupsFromArgs(longArgs)
  //*
  logInput(longArgs)
  deepLogger(globData)
  /** */
  assert.equal(globData.globGroups, [
    {
      key: '',
      raw: '',
      values: [
        'test/fixtures/md/basic.md',
        'test/fixtures/md/error-missing-transforms-two.md',
        'test/fixtures/md/error-missing-transforms.md',
        'test/fixtures/md/error-no-block-transform-defined.md',
        'test/fixtures/md/error-unbalanced.md',
        'test/fixtures/md/format-inline.md',
        'test/fixtures/md/format-with-wacky-indentation.md',
        'test/fixtures/md/inline-two.md',
        'test/fixtures/md/inline.md',
        'test/fixtures/md/missing-transform.md',
        'test/fixtures/md/mixed.md',
        'test/fixtures/md/no-transforms.md',
        'test/fixtures/md/string.md',
        'test/fixtures/md/syntax-legacy-colon.md',
        'test/fixtures/md/syntax-legacy-query.md',
        'test/fixtures/md/transform-code.md',
        'test/fixtures/md/transform-custom.md',
        'test/fixtures/md/transform-file.md',
        'test/fixtures/md/transform-remote.md',
        'test/fixtures/md/transform-toc.md',
        'test/fixtures/md/transform-wordCount.md'
      ]
    },
    {
      key: 'transform',
      raw: '--transform',
      values: [
        'test/fixtures/md/transform-code.md',
        'test/fixtures/md/transform-custom.md',
        'test/fixtures/md/transform-file.md',
        'test/fixtures/md/transform-remote.md',
        'test/fixtures/md/transform-toc.md',
        'test/fixtures/md/transform-wordCount.md'
      ]
    },
    {
      key: 'ignore',
      raw: '--ignore',
      values: [
        'test/fixtures/output/basic.md',
        'test/fixtures/output/block-no-transform.md',
        'test/fixtures/output/error-missing-transforms-two.md',
        'test/fixtures/output/error-missing-transforms.md',
        'test/fixtures/output/fixture-code.md',
        'test/fixtures/output/format-inline.md',
        'test/fixtures/output/format-with-wacky-indentation.md',
        'test/fixtures/output/go-simple.md',
        'test/fixtures/output/inline-two.md',
        'test/fixtures/output/inline.md',
        'test/fixtures/output/missing-transform.md',
        'test/fixtures/output/mixed.md',
        'test/fixtures/output/params.md',
        'test/fixtures/output/remote.md',
        'test/fixtures/output/toc.md',
        'test/fixtures/output/transform-code.md',
        'test/fixtures/output/transform-custom.md',
        'test/fixtures/output/transform-file.md',
        'test/fixtures/output/transform-remote.md',
        'test/fixtures/output/transform-toc.md',
        'test/fixtures/output/transform-wordCount.md',
        'test/fixtures/output/with-wacky-indentation.md'
      ]
    },
    {
      key: 'whatever',
      raw: '--whatever',
      values: [
        'test/fixtures/md/syntax-legacy-colon.md',
        'test/fixtures/md/syntax-legacy-query.md'
      ]
    },
    { key: 'fun', raw: '--fun', values: [ 'lol.md' ] }
  ])
})

test('test 2', () => {
  /* CLI command with list of files already passed in
    node ./cli.js --file '**.md' 'funky**.md' billy --foo 'bar*123'  
  */
  const rawArgv = [ '--file', '**.md', 'funky**.md', 'billy', '--foo', 'bar*123' ]

  logger(rawArgv.join(" "))

  const globData = getGlobGroupsFromArgs(rawArgv, {
    globKeys: ['file']
  })
  //*
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [ { key: 'file', raw: '--file', values: [ '**.md', 'funky**.md' ] } ],
    otherOpts: [ 'billy', '--foo', 'bar*123' ]
  })
})

test('Handles multiple string values and groups them', () => {
  /* CLI command with list of files already passed in
    node ./cli.js 'test/fixtures/md/bar.md' 'test/fixtures/output/foo.md'
  */
  const rawArgv = [ 'test/fixtures/md/bar.md', 'test/fixtures/output/foo.md' ]

  const globData = getGlobGroupsFromArgs(rawArgv)
  //*
  logInput(rawArgv)
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [
      {
        key: '',
        raw: '',
        values: [ 'test/fixtures/md/bar.md', 'test/fixtures/output/foo.md' ]
      }
    ],
    otherOpts: []
  })
})

test('Handles multiple string GLOB values and groups them', () => {
  /* CLI command with list of files already passed in
    node ./cli.js 'test/fixtures/md/**.md' 'test/fixtures/output/**.md'
  */
  const rawArgv = [ 'test/fixtures/md/**.md', 'test/fixtures/output/**.md' ]

  const globData = getGlobGroupsFromArgs(rawArgv)
  //*
  logInput(rawArgv)
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [
      {
        key: '',
        raw: '',
        values: [ 'test/fixtures/md/**.md', 'test/fixtures/output/**.md' ]
      }
    ],
    otherOpts: []
  })
})


test('Handles globKey set with multiple file/glob like values supplied afterwards', () => {
  /* CLI command with list of files already passed in
    node ./cli.js --file 'foobar.md' "funktown/bar.md" '**.md' 'funky**.md' billy --foo 'bar*123'
  */
  const rawArgv = [
    '--file',
    'foobar.md',
    'funktown/bar.md',
    '**.md',
    'funky**.md',
    'billy',
    '--foo',
    'bar*123'
  ]

  logger(rawArgv.join(" "))

  const globData = getGlobGroupsFromArgs(rawArgv, {
    globKeys: ['file']
  })
  //*
  logInput(rawArgv)
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [ { key: 'file', raw: '--file', values: [ 
      'foobar.md',
      'funktown/bar.md',
      '**.md', 
      'funky**.md' 
    ] 
    } 
    ],
    otherOpts: [ 'billy', '--foo', 'bar*123' ]
  })
})

test('Handles mixed strings, glob strings, array strings, and regex strings', () => {
  /* CLI command with list of files already passed in
node ./cli.js --file 'test/fixtures/md/**.md' 'test/fixtures/output/**.md' '[foo.md, bar.whatever.md, /patter.md/]'
*/
  const rawArgv = [
    '--file',
    'funktown/bar.md',
    'test/fixtures/md/**.md',
    'test/fixtures/output/**.md',
    '[foo.md, bar.whatever.md, /patter.md/]',
    '/funk.md/'
  ]

  logger(rawArgv.join(" "))

  const globData = getGlobGroupsFromArgs(rawArgv, {
    globKeys: ['file']
  })
  //*
  logInput(rawArgv)
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [
      {
        key: 'file',
        raw: '--file',
        values: [
          'funktown/bar.md',
          'test/fixtures/md/**.md',
          'test/fixtures/output/**.md',
          'foo.md',
          'bar.whatever.md',
          /patter\.md/,
          /funk\.md/
        ]
      }
    ],
    otherOpts: []
  })
})

test('Handles string arrays if globKeys set', () => {
  /* CLI command with list of files already passed in
  node ./cli.js --file '[**.md, /xyz**.md/]' 'funky**.md' billy --foo 'bar*123' --fuzz test/fixtures/output/**.md
  */
  const rawArgv = [
    '--file',
    '[**.md, /xyz**.md/]',
    'funky**.md',
    'billy',
    '--foo',
    'bar*123',
    '--fuzz',
    'test/fixtures/output/basic.md',
    'test/fixtures/output/block-no-transform.md',
    'test/fixtures/output/error-missing-transforms-two.md',
    'test/fixtures/output/error-missing-transforms.md',
    'test/fixtures/output/fixture-code.md',
    'test/fixtures/output/format-inline.md',
    'test/fixtures/output/format-with-wacky-indentation.md',
    'test/fixtures/output/go-simple.md',
    'test/fixtures/output/inline-two.md',
    'test/fixtures/output/inline.md',
    'test/fixtures/output/missing-transform.md',
    'test/fixtures/output/mixed.md',
    'test/fixtures/output/params.md',
    'test/fixtures/output/remote.md',
    'test/fixtures/output/toc.md',
    'test/fixtures/output/transform-code.md',
    'test/fixtures/output/transform-custom.md',
    'test/fixtures/output/transform-file.md',
    'test/fixtures/output/transform-remote.md',
    'test/fixtures/output/transform-toc.md',
    'test/fixtures/output/transform-wordCount.md',
    'test/fixtures/output/with-wacky-indentation.md'
  ]
  const globData = getGlobGroupsFromArgs(rawArgv, {
    globKeys: ['file']
  })
  //*
  logInput(rawArgv)
  deepLogger(globData)
  /** */
  assert.equal(globData, {
    globGroups: [
      {
        key: 'file',
        raw: '--file',
        values: [ '**.md', /xyz\*\*\.md/, 'funky**.md' ]
      },
      {
        key: 'fuzz',
        raw: '--fuzz',
        values: [
          'test/fixtures/output/basic.md',
          'test/fixtures/output/block-no-transform.md',
          'test/fixtures/output/error-missing-transforms-two.md',
          'test/fixtures/output/error-missing-transforms.md',
          'test/fixtures/output/fixture-code.md',
          'test/fixtures/output/format-inline.md',
          'test/fixtures/output/format-with-wacky-indentation.md',
          'test/fixtures/output/go-simple.md',
          'test/fixtures/output/inline-two.md',
          'test/fixtures/output/inline.md',
          'test/fixtures/output/missing-transform.md',
          'test/fixtures/output/mixed.md',
          'test/fixtures/output/params.md',
          'test/fixtures/output/remote.md',
          'test/fixtures/output/toc.md',
          'test/fixtures/output/transform-code.md',
          'test/fixtures/output/transform-custom.md',
          'test/fixtures/output/transform-file.md',
          'test/fixtures/output/transform-remote.md',
          'test/fixtures/output/transform-toc.md',
          'test/fixtures/output/transform-wordCount.md',
          'test/fixtures/output/with-wacky-indentation.md'
        ]
      }
    ],
    otherOpts: [ 'billy', '--foo', 'bar*123' ]
  })
})

test.run()