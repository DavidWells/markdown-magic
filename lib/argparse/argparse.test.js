// @ts-nocheck
const { test } = require('uvu')
const assert = require('uvu/assert')
const { deepLog } = require('../utils/logs')
const { uxParse } = require('./argparse')

const DEBUG = true
const logger = DEBUG ? console.log : () => {}
const deepLogger = DEBUG ? deepLog : () => {}

function logInput(rawArgs, result) {
  logger('\n───────────────────────')
  logger('Input:')
  logger(`CLI ${rawArgs.join(' ')}`)
  if (result) {
    deepLog('result', result)
  }
  logger('───────────────────────\n')
}

function stringToArgs(str) {
  return str.split(' ') //.map(x => x.trim()).filter(x => x !== '')
}

test('Exports API', () => {
  assert.equal(typeof uxParse, 'function', 'undefined val')
})

const cmd00 = stringToArgs('lol = true cool = false')
test.only(`CLI ${cmd00.join(' ')}`, () => {
  const result = uxParse(cmd00)
  logInput(cmd00, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd000 = stringToArgs('--lol true --cool false')
test(`CLI ${cmd000.join(' ')}`, () => {
  const result = uxParse(cmd000)
  logInput(cmd000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd0000 = stringToArgs('-lol true -cool false')
test(`CLI ${cmd0000.join(' ')}`, () => {
  const result = uxParse(cmd0000)
  logInput(cmd0000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd00000 = stringToArgs('-lol -cool ')
test(`CLI ${cmd00000.join(' ')}`, () => {
  const result = uxParse(cmd00000)
  logInput(cmd00000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: true })
})

const cmd000000 = stringToArgs('--stage prod --cool wild = yolo')
test(`CLI ${cmd000000.join(' ')}`, () => {
  const result = uxParse(cmd000000)
  logInput(cmd000000, result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd0 = stringToArgs('-f no word = { foo: bar }')
test(`Handles single dash options, CLI ${cmd0.join(' ')}`, () => {
  const result = uxParse(cmd0)
  logInput(cmd0, result)
  assert.equal(result.mergedOptions.f, 'no')
  assert.equal(result.mergedOptions.word, { foo: 'bar' })
  assert.equal(result.mergedOptions, { f: 'no', word: { foo: 'bar' } })
})

const cmd1 = stringToArgs('-f -x -xyz ballin -u jimmy')
test(`flags in a row "CLI ${cmd1.join(' ')}"`, () => {
  const result = uxParse(cmd1)
  deepLog('result', result)
  assert.equal(result.mergedOptions.xyz, 'ballin')
  assert.equal(result.mergedOptions, { f: true, x: true, xyz: 'ballin', u: 'jimmy' })
})

const cmd2 = stringToArgs('-f -x -xyz ballin = yo -u jimmy')
test(`flags in a row two "CLI ${cmd2.join(' ')}"`, () => {
  const result = uxParse(cmd2)
  deepLog('result', result)
  assert.equal(result.mergedOptions.ballin, 'yo')
})

const cmd3 = stringToArgs('-f -x -xyz ballin = yo -u jimmy=timmy')
test(`flags in a row two "CLI ${cmd3.join(' ')}"`, () => {
  const result = uxParse(cmd3)
  deepLog('result', result)
  assert.equal(result.mergedOptions.jimmy, 'timmy')
})

const cmd4 = stringToArgs(
  'whatever=[uno] -v=false nice -funky no -word { foo: bar } -w yo --what nice -f -x -xyz false -u jimmy --testx --file **.md --u word',
)
test(`Handles glob options "CLI ${cmd4.join(' ')}"`, () => {
  const result = uxParse(cmd4)
  deepLog('result', result)
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

const cmd5 = stringToArgs('--stage prod --cool wild=yolo')
test(`CLI ${cmd5.join(' ')}"`, () => {
  const result = uxParse(cmd5)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd6 = stringToArgs('--stage prod --cool wild=yolo --stage dev')
test.skip(`Takes last value for same flag "CLI ${cmd6.join(' ')}"`, () => {
  const result = uxParse(cmd6)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'dev', cool: true, wild: 'yolo' })
})

const cmd7 = stringToArgs('--stage prod --cool wild="yo lo" --stage dev --stage prod')
test(`Combines duplicate values into a deduplicated array "CLI ${cmd7.join(' ')}"`, () => {
  const result = uxParse(cmd7)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: 'yo lo' })
})

const cmd8 = stringToArgs('-stage prod -cool wild=yolo -stage dev')
test(`Combines duplicate values into an array "CLI ${cmd8.join(' ')}"`, () => {
  const result = uxParse(cmd8)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: 'yolo' })
})

const cmd9 = stringToArgs('-stage prod -cool wild=-yolo -stage dev -stage prod')
test(`Handles values with dashes "CLI ${cmd9.join(' ')}"`, () => {
  const result = uxParse(cmd9)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: '-yolo' })
})

const cmd10 = stringToArgs('-stage prod -cool wild=--yolo -stage dev -stage prod -stage dev')
test(`Handles values with dashes "CLI ${cmd10.join(' ')}"`, () => {
  const result = uxParse(cmd10)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: '--yolo' })
})

const cmd11 = stringToArgs('-stage prod -cool wild="--yolo"')
test(`Handles values with dashes "CLI ${cmd11.join(' ')}"`, () => {
  const result = uxParse(cmd11)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: '--yolo' })
})

const cmd12 = stringToArgs('-stage prod wild="yo=lo" -cool ')
const cmd13 = stringToArgs('wild="yo=lo" -stage prod -cool ')
const cmd14 = stringToArgs('-stage prod -cool wild="yo=lo"')
test(`Handles values with equals "CLI ${cmd12.join(' ')}"`, () => {
  const array = [cmd12, cmd13, cmd14]
  for (const cmd of array) {
    const result = uxParse(cmd)
    deepLog('result', result)
    assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yo=lo' })
  }
})

const cmd15 = stringToArgs('--param=userPoolId=us-west-1_fjsPJ6Q8J --param=userPoolClientId=19vdp5je9jsjkn488ddl4jvk19')
test(`Handles array values "CLI ${cmd15.join(' ')}"`, () => {
  const result = uxParse(cmd15)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    param: ['userPoolId=us-west-1_fjsPJ6Q8J', 'userPoolClientId=19vdp5je9jsjkn488ddl4jvk19'],
  })
})

const cmd16 = stringToArgs('--param="userPoolId=us-west-1_fjsPJ6Q8J" --param="userPoolClientId=19vdp5je9jsjkn488ddl4jvk19"')
test(`Strips surrounding quotes "CLI ${cmd16.join(' ')}"`, () => {
  const result = uxParse(cmd16)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    param: ['userPoolId=us-west-1_fjsPJ6Q8J', 'userPoolClientId=19vdp5je9jsjkn488ddl4jvk19'],
  })
})

const cmd17 = stringToArgs('--env.stage=prod --env.region=us-east-1')
test(`Handles dotted properties "CLI ${cmd17.join(' ')}"`, () => {
  const result = uxParse(cmd17)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    'env.stage': 'prod',
    'env.region': 'us-east-1'
  })
})

const cmd18 = stringToArgs('--array=[1,2,3] --items=["a","b","c"]')
test(`Handles array syntax "CLI ${cmd18.join(' ')}"`, () => {
  const result = uxParse(cmd18)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    array: [1, 2, 3],
    items: ['a', 'b', 'c']
  })
})

const cmd19 = stringToArgs('--config.json={"foo": "bar", "baz": 123}')
test(`Handles JSON objects "CLI ${cmd19.join(' ')}"`, () => {
  const result = uxParse(cmd19)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    'config.json': { foo: 'bar', baz: 123 }
  })
})

const cmd20 = stringToArgs('--empty --blank="" --null=null --undef=undefined')
test(`Handles special values "CLI ${cmd20.join(' ')}"`, () => {
  const result = uxParse(cmd20)
  deepLog('result', result)
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
  const result = uxParse(cmd21)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    'no-flag': true,
    flag: true,
    'enable-feature': true,
    'no-enable-feature': true
  })
})

const cmd22 = stringToArgs(`--spaced-string="hello world" --quoted='single quotes'`)
test(`Handles quoted strings with spaces "CLI ${cmd22.join(' ')}"`, () => {
  const result = uxParse(cmd22)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    'spaced-string': 'hello world',
    quoted: 'single quotes'
  })
})

// This one is wrong iirc
const cmd23 = stringToArgs('--numbers 1 2 3 --strings a b c')
test.skip(`Handles space-separated values "CLI ${cmd23.join(' ')}"`, () => {
  const result = uxParse(cmd23)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    numbers: ['1', '2', '3'],
    strings: ['a', 'b', 'c']
  })
})

const cmd24 = stringToArgs(`--key=value --key="other value" --key='third value'`)
test(`Handles multiple values for same key with different quote styles "CLI ${cmd24.join(' ')}"`, () => {
  const result = uxParse(cmd24)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    key: ['value', 'other value', 'third value']
  })
})

const cmd25 = stringToArgs('-abc -xyz=123 -def="value" -ghi')
test(`Handles single-letter flags in various formats "CLI ${cmd25.join(' ')}"`, () => {
  const result = uxParse(cmd25, { 
    stripSingleDashOptions: true 
  })
  deepLog('result', result)
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
test(`Handles multiple boolean assignments "CLI ${cmd26.join(' ')}"`, () => {
  const result = uxParse(cmd26)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    flag: [
      true,
      false,
      true,
    ],
    'no-flag': true
  })
})


const cmd27 = stringToArgs('-l -a -h')
test(`Short flags "CLI ${cmd27.join(' ')}"`, () => {
  const result = uxParse(cmd27)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    l: true,
    a: true,
    h: true
  })
})

const cmd28 = stringToArgs('-lah = yo')
test(`flag clustering "CLI ${cmd28.join(' ')}"`, () => {
  const result = uxParse(cmd28, true)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    l: true,
    a: true,
    h: true
  })
})


const cmd29 = stringToArgs('test.js --foo 1337 -B hello --mcgee')
test(`Short flags "CLI ${cmd29.join(' ')}"`, () => {
  const result = uxParse(cmd29)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    foo: 1337,
    B: 'hello',
    mcgee: true
  })
})


const cmd30 = stringToArgs('hey --foo=hi.hello?q=p hello')
test(`basic string parsing (equals long-arg-with-equals) "CLI ${cmd30.join(' ')}"`, () => {
  const result = uxParse(cmd30)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    // possibleLeadingCommands: ['hey'],
    hey: true, // @TODO fix this do we want it?
    foo: 'hi.hello?q=p',
    hello: true
  })
})

const cmd31 = stringToArgs('int=-5')
test(`basic int parsing "CLI ${cmd31.join(' ')}"`, () => {
  const result = uxParse(cmd31)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    int: -5
  })
})

test.run()
