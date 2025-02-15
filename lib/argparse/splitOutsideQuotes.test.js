const { test } = require('uvu')
const assert = require('uvu/assert')
const { splitOutsideQuotes } = require('./splitOutsideQuotes')

test('Exports API', () => {
  assert.equal(typeof splitOutsideQuotes, 'function', 'undefined val')
})

test('splitOutsideQuotes', () => {
   const tests = [
    `command arg1 arg2`,
    `command arg1 arg2 arg3 --stage prod`,
    `command arg1 arg2 arg3 --stage prod --stage dev`,
    `command arg1 arg2 arg3 --stage prod --stage dev stage = prod`,
    `test key="some value" other='single quotes'`,
    `complex obj={ test: true, nested: { wow: 1 } } simple=2`,
    `complex obj="{ test: true, nested: { wow: 1 } }" simple=2`,
    `complex obj='{ test: true, nested: { wow: 1, with: "sp ac es" } }' simple=2`,
    `array=[ 1, 2, "spaces here", { a: 1 } ] end=true`,
    `array='[ 1, 2, "spaces here", { a: 1 } ]' end=true`,
    `array="[ 1, 2, 'spaces here', { a: 1 } ]" end=true`,
    `mix="quoted { brackets }" obj={ unquoted: "value" }`,
    `mix="quoted { brackets }" obj={ unquoted: "val ue" }`,
    `mix="quoted { brackets }" obj={ unquoted: "val} foo" }`,
    `mix="quoted [ ]" obj=[ 1, 2, 3, "cool beans" ]`,
    `mix="quoted [ ]" obj=[ 1, 2, 3, "cool ]beans" ]`,
    `mix="quoted [ ]" obj={ nice: [ 1, 2, 3, 'nice', 'ra}d', "cool ]beans" ]}`,
    `nice=true word = bond ab funky= 'fresh'`,
    `nice=true word = bond ab funky= 'fre sh'`,
    `nice=wowow= rad`,
    `nice=wow=ow= rad=123`,
    `nice = wow= rad`,
    `nice = wo=w= rad`,
    `nice wow= rad=123`,
  ]
  const results = [
    ['command', 'arg1', 'arg2'],
    ['command', 'arg1', 'arg2', 'arg3', '--stage', 'prod'],
    ['command', 'arg1', 'arg2', 'arg3', '--stage', 'prod', '--stage', 'dev'],
    ['command', 'arg1', 'arg2', 'arg3', '--stage', 'prod', '--stage', 'dev', 'stage=prod'],
    ['test', 'key="some value"', 'other=\'single quotes\''],
    ['complex', 'obj={ test: true, nested: { wow: 1 } }', 'simple=2'],
    ['complex', 'obj="{ test: true, nested: { wow: 1 } }"', 'simple=2'],
    ['complex', `obj='{ test: true, nested: { wow: 1, with: "sp ac es" } }'`, 'simple=2'],
    ['array=[ 1, 2, "spaces here", { a: 1 } ]', 'end=true'],
    ['array=\'[ 1, 2, "spaces here", { a: 1 } ]\'', 'end=true'],
    ['array="[ 1, 2, \'spaces here\', { a: 1 } ]"', 'end=true'],
    ['mix="quoted { brackets }"', 'obj={ unquoted: "value" }'],
    ['mix="quoted { brackets }"', 'obj={ unquoted: "val ue" }'],
    ['mix="quoted { brackets }"', 'obj={ unquoted: "val} foo" }'],
    ['mix="quoted [ ]"', 'obj=[ 1, 2, 3, "cool beans" ]'],
    ['mix="quoted [ ]"', 'obj=[ 1, 2, 3, "cool ]beans" ]'],
    [`mix="quoted [ ]"`, `obj={ nice: [ 1, 2, 3, 'nice', 'ra}d', "cool ]beans" ]}`],
    [
      'nice=true',
      'word=bond',
      'ab',
      `funky='fresh'`
    ],
    [
      'nice=true',
      'word=bond',
      'ab',
      `funky='fre sh'`
    ],
    [
      'nice=wowow=',
      'rad'
    ],
    [
      'nice=wow=ow=',
      'rad=123'
    ],
    [
      'nice=wow=',
      'rad'
    ],
    [
      'nice=wo=w=',
      'rad'
    ],
    [
      'nice',
      'wow=rad=123'
    ]
  ]
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const result = splitOutsideQuotes(test)
    /*
    console.log('test', test)
    console.log('result', result)
    console.log('───────────────────────────────')
    // process.exit(1)
    /** */
    assert.equal(result, results[i], `test ${i}. \nExpected ${results[i]} \nGot..... ${result}`)
  }
})

test.run()
