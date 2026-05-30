// @ts-nocheck
const util = require('util')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { dxParse, getGlobGroupsFromArgs, splitOutsideQuotes } = require('../src')

const DEBUG = (process.argv.includes('--debug')) ? true : false
const logger = DEBUG ? console.log : () => {}
const deepLogger = DEBUG ? (label, value) => console.log(label, util.inspect(value, false, null, true)) : () => {}

function logInput(rawArgs, result) {
  logger('\n───────────────────────')
  logger('Input:')
  logger(`CLI ${rawArgs.join(' ')}`)
  if (result) {
    deepLogger('result', result)
  }
  logger('───────────────────────\n')
}

function stringToArgs(str) {
  return str.split(' ') //.map(x => x.trim()).filter(x => x !== '')
}

test('Exports API', () => {
  assert.equal(typeof dxParse, 'function', 'undefined val')
})

test('README documented examples stay accurate', () => {
  assert.equal(dxParse(['-files', 'README.md', '-dry']).mergedOptions, {
    files: 'README.md',
    dry: true
  })
  assert.equal(dxParse(['-files', 'README.md', '-dry']).globGroups, [
    { key: 'files', rawKey: '-files', values: ['README.md'] }
  ])
  assert.equal(dxParse(['--stage', 'prod', 'cool', '=', 'true']).mergedOptions, {
    stage: 'prod',
    cool: true
  })
  assert.equal(getGlobGroupsFromArgs(['--files', 'README.md', 'docs/**/*.md'], {
    globKeys: ['files']
  }).globGroups, [
    { key: 'files', rawKey: '--files', values: ['README.md', 'docs/**/*.md'] }
  ])
  assert.equal(splitOutsideQuotes('name = "David Wells" config={ enabled: true }'), [
    'name="David Wells"',
    'config={ enabled: true }'
  ])
  assert.equal(dxParse(['README.md', 'docs/**/*.md', '--stage', 'dev']).globGroups, [
    { key: '', rawKey: '', values: ['README.md', 'docs/**/*.md'] }
  ])
  assert.equal(dxParse(['README.md', 'docs/**/*.md', '--stage', 'dev']).mergedOptions, {
    stage: 'dev'
  })
  assert.equal(dxParse(['--ignore', 'dist/**/*.md'], {
    globKeys: ['files', 'file', 'path', 'ignore']
  }).globGroups, [
    { key: 'ignore', rawKey: '--ignore', values: ['dist/**/*.md'] }
  ])
  assert.equal(dxParse(['README.md', 'NOTES.md', 'build', '=', 'false']).mergedOptions, {
    build: false
  })
  assert.equal(dxParse(['--stage', 'dev', '--stage', 'prod']).mergedOptions, {
    stage: 'prod'
  })
  assert.equal(dxParse(['--tag', 'one', '--tag', 'two'], { accumulate: ['tag'] }).mergedOptions, {
    tag: ['one', 'two']
  })
  assert.equal(dxParse(['--tag', 'one', '--tag', 'two'], { accumulateFlags: ['tag'] }).mergedOptions, {
    tag: ['one', 'two']
  })
  assert.equal(dxParse(['--tag', 'one', '--tag', 'two'], { arrayKeys: ['tag'] }).mergedOptions, {
    tag: ['one', 'two']
  })
  assert.equal(dxParse(['-stage', 'prod']).mergedOptions, { stage: 'prod' })
  assert.equal(dxParse(['-config', 'md.config.js']).mergedOptions, { config: 'md.config.js' })
  assert.equal(dxParse(['-l', '-a', '-h']).mergedOptions, { l: true, a: true, h: true })
  assert.equal(dxParse(['-abc']).mergedOptions, { abc: true })
  assert.equal(dxParse(['-abc'], {
    allowShortClusters: true,
    shortFlags: ['a', 'b', 'c']
  }).mergedOptions, { a: true, b: true, c: true })
})

const cmd00 = stringToArgs('lol = true cool = false')
test(`CLI ${cmd00.join(' ')}`, () => {
  const result = dxParse(cmd00)
  logInput(cmd00, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd000 = stringToArgs('--lol true --cool false')
test(`CLI ${cmd000.join(' ')}`, () => {
  const result = dxParse(cmd000)
  logInput(cmd000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd0000 = stringToArgs('-lol true -cool false')
test(`CLI ${cmd0000.join(' ')}`, () => {
  const result = dxParse(cmd0000)
  logInput(cmd0000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd00000 = stringToArgs('-lol -cool ')
test(`CLI ${cmd00000.join(' ')}`, () => {
  const result = dxParse(cmd00000)
  logInput(cmd00000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: true })
})

const cmd000000 = stringToArgs('--stage prod --cool wild = yolo')
test(`CLI ${cmd000000.join(' ')}`, () => {
  const result = dxParse(cmd000000)
  logInput(cmd000000, result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd0 = stringToArgs('-f no word = { foo: bar }')
test(`Handles single dash options, CLI ${cmd0.join(' ')}`, () => {
  const result = dxParse(cmd0)
  logInput(cmd0, result)
  assert.equal(result.mergedOptions.f, 'no')
  assert.equal(result.mergedOptions.word, { foo: 'bar' })
  assert.equal(result.mergedOptions, { f: 'no', word: { foo: 'bar' } })
})

const cmd1 = stringToArgs('-f -x -xyz ballin -u jimmy')
test(`flags in a row "CLI ${cmd1.join(' ')}"`, () => {
  const result = dxParse(cmd1)
  deepLogger('result', result)
  assert.equal(result.mergedOptions.xyz, 'ballin')
  assert.equal(result.mergedOptions, { f: true, x: true, xyz: 'ballin', u: 'jimmy' })
})

const cmd2 = stringToArgs('-f -x -xyz ballin = yo -u jimmy')
test(`flags in a row two "CLI ${cmd2.join(' ')}"`, () => {
  const result = dxParse(cmd2)
  deepLogger('result', result)
  assert.equal(result.mergedOptions.ballin, 'yo')
})

const cmd3 = stringToArgs('-f -x -xyz ballin = yo -u jimmy=timmy')
test(`flags in a row two "CLI ${cmd3.join(' ')}"`, () => {
  const result = dxParse(cmd3)
  deepLogger('result', result)
  assert.equal(result.mergedOptions.jimmy, 'timmy')
})

const cmd4 = stringToArgs(
  'whatever=[uno] -v=false nice -funky no -word { foo: bar } -w yo --what nice -f -x -xyz false -u jimmy --testx --file **.md --u word',
)
test(`Handles glob options "CLI ${cmd4.join(' ')}"`, () => {
  const result = dxParse(cmd4, { accumulate: ['u'] })
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    whatever: ['uno'],
    v: false,
    nice: true,
    funky: 'no',
    word: { foo: 'bar' },
    w: 'yo',
    what: 'nice',
    f: true,
    x: true,
    xyz: false,
    u: [ 'jimmy', 'word' ],
    testx: true,
    file: '**.md',
  })
})

const filePatternArgs = stringToArgs('--file **/*.md')
test(`Groups single --file glob pattern "CLI ${filePatternArgs.join(' ')}"`, () => {
  const result = dxParse(filePatternArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    { key: 'file', rawKey: '--file', values: ['**/*.md'] }
  ])
  assert.equal(result.mergedOptions.file, '**/*.md')
})

const filesPatternArgs = stringToArgs('--files README.md docs/**/*.md --stage dev')
test(`Groups multiple --files patterns and leaves other options "CLI ${filesPatternArgs.join(' ')}"`, () => {
  const result = dxParse(filesPatternArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    { key: 'files', rawKey: '--files', values: ['README.md', 'docs/**/*.md'] }
  ])
  assert.equal(result.mergedOptions.stage, 'dev')
})

const bareFilePatternArgs = stringToArgs('README.md docs/**/*.md --stage dev')
test(`Groups bare positional file patterns "CLI ${bareFilePatternArgs.join(' ')}"`, () => {
  const result = dxParse(bareFilePatternArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    { key: '', rawKey: '', values: ['README.md', 'docs/**/*.md'] }
  ])
  assert.equal(result.leadingCommands, [])
  assert.equal(result.mergedOptions.stage, 'dev')
})

const pathPatternArgs = stringToArgs('--path docs/**/*.md --stage dev')
test(`Groups --path glob pattern "CLI ${pathPatternArgs.join(' ')}"`, () => {
  const result = dxParse(pathPatternArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    { key: 'path', rawKey: '--path', values: ['docs/**/*.md'] }
  ])
  assert.equal(result.mergedOptions.stage, 'dev')
})

const singleDashConfigFileArgs = stringToArgs('-config md.config.js -stage dev')
test(`Promotes consumed single-dash file-valued options "CLI ${singleDashConfigFileArgs.join(' ')}"`, () => {
  const result = dxParse(singleDashConfigFileArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    { key: 'config', rawKey: '-config', values: ['md.config.js'] }
  ])
  assert.equal(result.mergedOptions, {
    config: 'md.config.js',
    stage: 'dev'
  })
})

const shellExpandedFileArgs = [
  'CONTRIBUTING.md',
  'NOTES.md',
  'README.md',
  'large-table.md',
  'foo',
  'bar',
  '=',
  'false',
  'lol={x:100}'
]
test(`Does not treat shell-expanded file matches as leading commands`, () => {
  const result = dxParse(shellExpandedFileArgs)
  deepLogger('result', result)
  assert.equal(result.globGroups, [
    {
      key: '',
      rawKey: '',
      values: ['CONTRIBUTING.md', 'NOTES.md', 'README.md', 'large-table.md']
    }
  ])
  assert.equal(result.leadingCommands, ['foo'])
  assert.equal(result.mergedOptions, {
    foo: true,
    bar: false,
    lol: { x: 100 }
  })
})

const cmd5 = stringToArgs('--stage prod --cool wild=yolo')
test(`CLI ${cmd5.join(' ')}"`, () => {
  const result = dxParse(cmd5)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd6 = stringToArgs('--stage prod --cool wild=yolo --stage dev')
test(`Takes last value for same flag "CLI ${cmd6.join(' ')}"`, () => {
  const result = dxParse(cmd6)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'dev', cool: true, wild: 'yolo' })
})

const cmd7 = stringToArgs('--stage prod --cool wild="yo lo" --stage dev --stage prod')
test(`Takes last value for duplicate long flags "CLI ${cmd7.join(' ')}"`, () => {
  const result = dxParse(cmd7)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yo lo' })
})

const cmd8 = stringToArgs('-stage prod -cool wild=yolo -stage dev')
test(`Takes last value for duplicate forgiving single-dash long flags "CLI ${cmd8.join(' ')}"`, () => {
  const result = dxParse(cmd8)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'dev', cool: true, wild: 'yolo' })
})

const cmd9 = stringToArgs('-stage prod -cool wild=-yolo -stage dev -stage prod')
test(`Handles values with dashes "CLI ${cmd9.join(' ')}"`, () => {
  const result = dxParse(cmd9)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: '-yolo' })
})

const cmd10 = stringToArgs('-stage prod -cool wild=--yolo -stage dev -stage prod -stage dev')
test(`Handles values with dashes "CLI ${cmd10.join(' ')}"`, () => {
  const result = dxParse(cmd10)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'dev', cool: true, wild: '--yolo' })
})

const cmd11 = stringToArgs('-stage prod -cool wild="--yolo"')
test(`Handles values with dashes "CLI ${cmd11.join(' ')}"`, () => {
  const result = dxParse(cmd11)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: '--yolo' })
})

const cmd12 = stringToArgs('-stage prod wild="yo=lo" -cool ')
const cmd13 = stringToArgs('wild="yo=lo" -stage prod -cool ')
const cmd14 = stringToArgs('-stage prod -cool wild="yo=lo"')
test(`Handles values with equals "CLI ${cmd12.join(' ')}"`, () => {
  const array = [cmd12, cmd13, cmd14]
  for (const cmd of array) {
    const result = dxParse(cmd)
    deepLogger('result', result)
    assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yo=lo' })
  }
})

const cmd15 = stringToArgs('--param=userPoolId=us-west-1_fjsPJ6Q8J --param=userPoolClientId=19vdp5je9abc488ddl4jvk19')
test(`Accumulates configured array values "CLI ${cmd15.join(' ')}"`, () => {
  const result = dxParse(cmd15, { accumulate: ['param'] })
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    param: ['userPoolId=us-west-1_fjsPJ6Q8J', 'userPoolClientId=19vdp5je9abc488ddl4jvk19'],
  })
})

const cmd16 = stringToArgs('--param="userPoolId=us-west-1_fjsPJ6Q8J" --param="userPoolClientId=19vdp5je9abc488ddl4jvk19"')
test(`Strips surrounding quotes "CLI ${cmd16.join(' ')}"`, () => {
  const result = dxParse(cmd16, { accumulate: ['param'] })
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    param: ['userPoolId=us-west-1_fjsPJ6Q8J', 'userPoolClientId=19vdp5je9abc488ddl4jvk19'],
  })
})

const cmd17 = stringToArgs('--env.stage=prod --env.region=us-east-1')
test(`Handles dotted properties "CLI ${cmd17.join(' ')}"`, () => {
  const result = dxParse(cmd17)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    'env.stage': 'prod',
    'env.region': 'us-east-1'
  })
})

const cmd18 = stringToArgs('--array=[1,2,3] --items=["a","b","c"]')
test(`Handles array syntax "CLI ${cmd18.join(' ')}"`, () => {
  const result = dxParse(cmd18)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    array: [1, 2, 3],
    items: ['a', 'b', 'c']
  })
})

const cmd19 = stringToArgs('--config.json={"foo": "bar", "baz": 123}')
test(`Handles JSON objects "CLI ${cmd19.join(' ')}"`, () => {
  const result = dxParse(cmd19)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    'config.json': { foo: 'bar', baz: 123 }
  })
})

const cmd20 = stringToArgs('--empty --blank="" --null=null --undef=undefined')
test(`Handles special values "CLI ${cmd20.join(' ')}"`, () => {
  const result = dxParse(cmd20)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    empty: true,
    blank: '',
    null: null,
    undef: 'undefined' // @TODO fix this to undefined?
  })
})

// @TODO invert no prefixes?
const cmd21 = stringToArgs('--flag --no-flag --enable-feature --no-enable-feature')
test(`Handles boolean flags with no- prefix "CLI ${cmd21.join(' ')}"`, () => {
  const result = dxParse(cmd21)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    flag: false,
    'enable-feature': false
  })
})

const cmd22 = stringToArgs(`--spaced-string="hello world" --quoted='single quotes'`)
test(`Handles quoted strings with spaces "CLI ${cmd22.join(' ')}"`, () => {
  const result = dxParse(cmd22)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    'spaced-string': 'hello world',
    quoted: 'single quotes'
  })
})

// This one is wrong iirc
const cmd23 = stringToArgs('--numbers 1 2 3 --strings a b c')
test.skip(`Handles space-separated values "CLI ${cmd23.join(' ')}"`, () => {
  const result = dxParse(cmd23)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    numbers: ['1', '2', '3'],
    strings: ['a', 'b', 'c']
  })
})

const cmd24 = stringToArgs(`--key=value --key="other value" --key='third value'`)
test(`Accumulates configured repeated key with different quote styles "CLI ${cmd24.join(' ')}"`, () => {
  const result = dxParse(cmd24, { accumulate: ['key'] })
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    key: ['value', 'other value', 'third value']
  })
})

const cmd25 = stringToArgs('-abc -xyz=123 -def="value" -ghi')
test(`Handles single-letter flags in various formats "CLI ${cmd25.join(' ')}"`, () => {
  const result = dxParse(cmd25, {
    allowShortClusters: true,
    shortFlags: ['a', 'b', 'c', 'g', 'h', 'i'],
    stripSingleDashOptions: true
  })
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    a: true,
    b: true,
    c: true,
    xyz: 123,
    def: 'value',
    g: true,
    h: true,
    i: true
  })
})

const cmd26 = stringToArgs('--flag=true --flag=false --flag --no-flag')
test(`Takes last value for multiple boolean assignments "CLI ${cmd26.join(' ')}"`, () => {
  const result = dxParse(cmd26)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    flag: false
  })
})


const cmd27 = stringToArgs('-l -a -h')
test(`Short flags "CLI ${cmd27.join(' ')}"`, () => {
  const result = dxParse(cmd27)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    l: true,
    a: true,
    h: true
  })
})

const cmd28 = stringToArgs('-lah = yo')
test(`flag clustering "CLI ${cmd28.join(' ')}"`, () => {
  const result = dxParse(cmd28, true)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    l: true,
    a: true,
    h: true
  })
})


const cmd29 = stringToArgs('test.js --foo 1337 -B hello --mcgee')
test(`Short flags "CLI ${cmd29.join(' ')}"`, () => {
  const result = dxParse(cmd29)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    foo: 1337,
    B: 'hello',
    mcgee: true
  })
})


const cmd30 = stringToArgs('hey --foo=hi.hello?q=p hello')
test(`basic string parsing (equals long-arg-with-equals) "CLI ${cmd30.join(' ')}"`, () => {
  const result = dxParse(cmd30)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    // possibleLeadingCommands: ['hey'],
    hey: true, // @TODO fix this do we want it?
    foo: 'hi.hello?q=p',
    hello: true
  })
})

const cmd31 = stringToArgs('int=-5')
test(`basic int parsing "CLI ${cmd31.join(' ')}"`, () => {
  const result = dxParse(cmd31)
  deepLogger('result', result)
  assert.equal(result.mergedOptions, {
    int: -5
  })
})

test.run()
