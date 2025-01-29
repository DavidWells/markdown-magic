const { test } = require('uvu')
const assert = require('uvu/assert')
const { deepLog } = require('./utils/logs')
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
test(`CLI ${cmd00.join(' ')}`, () => {
  const result = uxParse({}, cmd00)
  logInput(cmd00, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd000 = stringToArgs('--lol true --cool false')
test(`CLI ${cmd000.join(' ')}`, () => {
  const result = uxParse({}, cmd000)
  logInput(cmd000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd0000 = stringToArgs('-lol true -cool false')
test(`CLI ${cmd0000.join(' ')}`, () => {
  const result = uxParse({}, cmd0000)
  logInput(cmd0000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: false })
})

const cmd00000 = stringToArgs('-lol -cool ')
test(`CLI ${cmd00000.join(' ')}`, () => {
  const result = uxParse({}, cmd00000)
  logInput(cmd00000, result)
  assert.equal(result.mergedOptions, { lol: true, cool: true })
})

const cmd000000 = stringToArgs('--stage prod --cool wild = yolo')
test(`CLI ${cmd000000.join(' ')}`, () => {
  const result = uxParse({}, cmd000000)
  logInput(cmd000000, result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd0 = stringToArgs('-f no word = { foo: bar }')
test(`Handles single dash options, CLI ${cmd0.join(' ')}`, () => {
  const result = uxParse({}, cmd0)
  logInput(cmd0, result)
  assert.equal(result.mergedOptions.f, 'no')
  assert.equal(result.mergedOptions.word, { foo: 'bar' })
  assert.equal(result.mergedOptions, { f: 'no', word: { foo: 'bar' } })
})

const cmd1 = stringToArgs('-f -x -xyz ballin -u jimmy')
test(`flags in a row "CLI ${cmd1.join(' ')}"`, () => {
  const result = uxParse({}, cmd1)
  deepLog('result', result)
  assert.equal(result.mergedOptions.xyz, 'ballin')
  assert.equal(result.mergedOptions, { f: true, x: true, xyz: 'ballin', u: 'jimmy' })
})

const cmd2 = stringToArgs('-f -x -xyz ballin = yo -u jimmy')
test(`flags in a row two "CLI ${cmd2.join(' ')}"`, () => {
  const result = uxParse({}, cmd2)
  deepLog('result', result)
  assert.equal(result.mergedOptions.ballin, 'yo')
})

const cmd3 = stringToArgs('-f -x -xyz ballin = yo -u jimmy=timmy')
test(`flags in a row two "CLI ${cmd3.join(' ')}"`, () => {
  const result = uxParse({}, cmd3)
  deepLog('result', result)
  assert.equal(result.mergedOptions.jimmy, 'timmy')
})

const cmd4 = stringToArgs(
  'whatever=[uno] -v=false nice -funky no -word { foo: bar } -w yo --what nice -f -x -xyz false -u jimmy --testx --file **.md --u word',
)
test(`Handles glob options "CLI ${cmd4.join(' ')}"`, () => {
  const result = uxParse({}, cmd4)
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
    u: 'word',
    testx: true,
    file: '**.md',
  })
})

const cmd5 = stringToArgs('--stage prod --cool wild=yolo')
test(`CLI ${cmd5.join(' ')}"`, () => {
  const result = uxParse({}, cmd5)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yolo' })
})

const cmd6 = stringToArgs('--stage prod --cool wild=yolo --stage dev')
test.skip(`Takes last value for same flag "CLI ${cmd6.join(' ')}"`, () => {
  const result = uxParse({}, cmd6)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'dev', cool: true, wild: 'yolo' })
})

const cmd7 = stringToArgs('--stage prod --cool wild="yo lo" --stage dev --stage prod')
test(`Tombines duplicate values into an array "CLI ${cmd7.join(' ')}"`, () => {
  const result = uxParse({}, cmd7)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev', 'prod'], cool: true, wild: 'yo lo' })
})

const cmd8 = stringToArgs('-stage prod -cool wild=yolo -stage dev')
test(`Combines duplicate values into an array "CLI ${cmd8.join(' ')}"`, () => {
  const result = uxParse({}, cmd8)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: 'yolo' })
})

const cmd9 = stringToArgs('-stage prod -cool wild=-yolo -stage dev -stage prod')
test(`Handles values with dashes "CLI ${cmd9.join(' ')}"`, () => {
  const result = uxParse({}, cmd9)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: '-yolo' })
})

const cmd10 = stringToArgs('-stage prod -cool wild=--yolo -stage dev -stage prod -stage dev')
test(`Handles values with dashes "CLI ${cmd10.join(' ')}"`, () => {
  const result = uxParse({}, cmd10)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: ['prod', 'dev'], cool: true, wild: '--yolo' })
})

const cmd11 = stringToArgs('-stage prod -cool wild="--yolo"')
test(`Handles values with dashes "CLI ${cmd11.join(' ')}"`, () => {
  const result = uxParse({}, cmd11)
  deepLog('result', result)
  assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: '--yolo' })
})

const cmd12 = stringToArgs('-stage prod wild="yo=lo" -cool ')
const cmd13 = stringToArgs('wild="yo=lo" -stage prod -cool ')
const cmd14 = stringToArgs('-stage prod -cool wild="yo=lo"')
test(`Handles values with equals "CLI ${cmd12.join(' ')}"`, () => {
  const array = [cmd12, cmd13, cmd14]
  for (const cmd of array) {
    const result = uxParse({}, cmd)
    deepLog('result', result)
    assert.equal(result.mergedOptions, { stage: 'prod', cool: true, wild: 'yo=lo' })
  }
})

//const cmd15 = stringToArgs('--param="userPoolId=us-west-1_fjsPJ6Q8J" --param="userPoolClientId=19vdp5je9jsjkn488ddl4jvk19"')
const cmd15 = stringToArgs('--param=userPoolId=us-west-1_fjsPJ6Q8J --param=userPoolClientId=19vdp5je9jsjkn488ddl4jvk19')

test(`Handles values with equals "CLI ${cmd15.join(' ')}"`, () => {
  const result = uxParse({}, cmd15)
  deepLog('result', result)
  assert.equal(result.mergedOptions, {
    param: ['userPoolId=us-west-1_fjsPJ6Q8J', 'userPoolClientId=19vdp5je9jsjkn488ddl4jvk19'],
  })
})

test.run()
