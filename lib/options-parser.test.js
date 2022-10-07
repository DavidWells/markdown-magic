const { test } = require('uvu') 
const assert = require('uvu/assert')
const optionsParse = require('./options-parser')

test('Empty value', () => {
  assert.equal(optionsParse(), {}, 'undefined val')
  assert.equal(optionsParse(''), {}, 'empty string')
  assert.equal(optionsParse(null), {}, 'null')
})

const stringExample = `abc=yo foo=bar baz='hello' bim='boop dop' fizz="pop" pow="bang bang"`
test('string test', () => {
  const parsedValue = optionsParse(stringExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    abc: 'yo',
    foo: 'bar',
    baz: 'hello', 
    bim: 'boop dop',
    fizz: "pop",
    pow: "bang bang"
  })
})

const stringExampleWithBoolean = `abc=yo foo=bar bim='boop dop' boo=true`
test('string test two', () => {
  const parsedValue = optionsParse(stringExampleWithBoolean)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    abc: 'yo',
    foo: 'bar',
    bim: 'boop dop',
    boo: true
  })
})

const bigExample = `width={999} 
  height={{111}}
  numberAsString="12345"   
 great={["scoot", "sco ot", 'scooo ttt']} 
 nice={{ value: nice, cool: "true" }}
 soclose=[jdjdjd, hdhfhfhffh]
 rad="boss"
 cool=true notCool=false
 nooooo={[one, two, 3, 4]}
 numberArray=[3, 7]
 stringArray=["3", "7"]
 numberZero=0,
 xyz=999,
 nope=false,
 // comment
 yes={true}
 isWhat,
 /* comment */
 foo={{ rad: ["whatever", "man", "with spaces"], cool: { beans: 'here' } }}
 # other comment
 what='xnxnx'
 isLoading  
 whatever={{ chill: "https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna", pill: ['yo']}}
 href="https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna"
 src="https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
 deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}`

test('Multi line', () => {
  const parsedValue = optionsParse(bigExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: "12345",   
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nice: { value: 'nice', cool: 'true' },
    soclose: [ 'jdjdjd', 'hdhfhfhffh' ],
    rad: 'boss',
    cool: true,
    notCool: false,
    nooooo: [ 'one', 'two', 3, 4 ],
    numberArray: [3, 7],
    stringArray: ["3", "7"],
    numberZero: 0,
    xyz: 999,
    nope: false,
    yes: true,
    isWhat: true,
    foo: { rad: [ 'whatever', 'man', "with spaces" ], cool: { beans: 'here' } },
    what: 'xnxnx',
    isLoading: true,
    whatever: {
      chill: "https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
      pill: [ 'yo' ]
    },
    href: "https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
    src: 'https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg',
    deep: { rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }
  }, 'matches original')
})

const testSpacing = `width={999} 
  height={{111}}
  numberAsString="12345"   
  great={["scoot", "sco ot", 'scooo ttt']} 
  nope=false,
  // comment
 yes={true}
 isWhat,
 /* comment */
 foo={{ rad: ["what ever", "man"], cool: { beans: 'here' } }}
 # other comment
 what='xnxnx'
    isLoading  
    href="https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna"
    src="https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
    deep={{ rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }}
`

// Verify indentation doesnt matter
test('Multi line indent', () => {
  const parsedValue = optionsParse(testSpacing)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: '12345',
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nope: false,
    yes: true,
    isWhat: true,
    foo: { rad: [ 'what ever', 'man' ], cool: { beans: 'here' } },
    what: 'xnxnx',
    isLoading: true,
    href: "https://fooo.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna",
    src: 'https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg',
    deep: { rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }
  }, 'matches original')
})

test('Single line', () => {
  const parsedValue = optionsParse(`width={999} height={{111}} numberAsString="12345" great={["scoot", "sco ot", 'scooo ttt']} nice={{ value: nice, cool: "true" }} soclose=[jdjdjd, hdhfhfhffh] rad="boss" cool=true isCool notCool=false nooooo={[one, two, 3, 4]}`)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    width: 999,
    height: 111,
    numberAsString: '12345',
    great: [ 'scoot', 'sco ot', 'scooo ttt' ],
    nice: { value: 'nice', cool: 'true' },
    soclose: [ 'jdjdjd', 'hdhfhfhffh' ],
    rad: 'boss',
    cool: true,
    isCool: true,
    notCool: false,
    nooooo: [ 'one', 'two', 3, 4 ]
  }, 'matches original')
})

test('Simple string equal (single quotes)', () => {
  const parsedValue = optionsParse(`bob='cool'`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (double quotes)', () => {
  const parsedValue = optionsParse(`bob="cool"`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (no quotes). key=value', () => {
  const parsedValue = optionsParse(`bob=cool`)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
  // Booleans are booleans
  assert.equal(optionsParse(`thingy=true`), { thingy: true })
  assert.equal(optionsParse(`thingy=false`), { thingy: false })
})

test('Simple string equal (no quotes with spaces). key = value', () => {
  const answer = { bob: 'cool' }
  const one = optionsParse(`bob = cool`)
  const two = optionsParse(`bob= cool`)
  const three = optionsParse(`bob =cool`)

  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
})

test('Simple string react-like syntax. key={"value"}', () => {
  const answer = { bob: 'cool' }
  const four = optionsParse(`bob={'cool'}`)
  const five = optionsParse(`bob={"cool"}`)
  const six = optionsParse(`bob={{"cool"}}`)
  assert.equal(four, answer)
  assert.equal(five, answer)
  assert.equal(six, answer)
})

test('Simple strings mixed', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool' 
  }
  const one = optionsParse(`
  bob = cool
  joe=cool
  bill="cool"
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)

  const two = optionsParse(`bob = cool joe=cool bill="cool" steve='cool'`)
  assert.equal(two, answer)
})

test('Simple numbers', () => {
  const one = optionsParse(`isCool=20`)
  assert.equal(one, { isCool: 20 })

  const two = optionsParse(`isCool=20.2`)
  assert.equal(two, { isCool: 20.2 })

  const three = optionsParse(`isCool={20.2}`)
  assert.equal(three, { isCool: 20.2 })

  const four = optionsParse(`isCool={{20.2}}`)
  assert.equal(four, { isCool: 20.2 })

  const five = optionsParse(`isCool=0`)
  assert.equal(five, { isCool: 0 })

  const sixAsString = optionsParse(`isCool="0"`)
  assert.equal(sixAsString, { isCool: "0" })

  const decimal = optionsParse(`isCool=0.22`)
  assert.equal(decimal, { isCool: 0.22 })
})

test('Simple boolean', () => {
  const answer = { isCool: true }
  const one = optionsParse(`isCool`)
  const two = optionsParse(`isCool = true`)
  const three = optionsParse(`isCool =true`)
  const four = optionsParse(`isCool=true`)
  const fourx = optionsParse(`isCool={true}`)
  const foury = optionsParse(`isCool={{true}}`)
  const boolString = optionsParse(`isCool="true"`)
  const boolStringTwo = optionsParse(`isCool='true'`)

  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
  assert.equal(four, answer)
  assert.equal(fourx, answer)
  assert.equal(foury, answer)
  assert.equal(boolString, { isCool: 'true' })
  assert.equal(boolStringTwo, { isCool: 'true' })

  const answerTwo = { isNotCool: false }
  const five = optionsParse(`isNotCool=false`)
  const six = optionsParse(`isNotCool = false`)
  const seven = optionsParse(`isNotCool =false`)
  const eight = optionsParse(`isNotCool=false`)
  const nine = optionsParse(`isNotCool= false`)
  const ten = optionsParse(`isNotCool={false}`)
  const eleven = optionsParse(`isNotCool={{false}}`)
  const boolStringFalse = optionsParse(`isNotCool="false"`)
  const boolStringFalseTwo = optionsParse(`isNotCool='false'`)

  assert.equal(five, answerTwo, 'five')
  assert.equal(six, answerTwo, 'six')
  assert.equal(seven, answerTwo, 'seven')
  assert.equal(eight, answerTwo, 'eight')
  assert.equal(nine, answerTwo, 'nine')
  assert.equal(ten, answerTwo, 'ten')
  assert.equal(eleven, answerTwo, 'eleven')
  assert.equal(boolStringFalse, { isNotCool: 'false' })
  assert.equal(boolStringFalseTwo, { isNotCool: 'false' })
})

test('Multiline boolean', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    isRad: true,
    bill: "cool",
    isNotCool: false,
    steve: 'cool',
    isCool: true
  }
  const one = optionsParse(`
  bob = cool
  joe=cool
  isRad
  bill="cool"
  isNotCool=false
  steve='cool'
  isCool
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Simple object', () => {
  const a = { key: { a: 'b' }}
  assert.equal(a, optionsParse(`key={{ "a": "b" }}`))
  assert.equal(a, optionsParse(`key={{ "a": b }}`))
  assert.equal(a, optionsParse(`key={{ a: "b" }}`))
  assert.equal(a, optionsParse(`key={{ a: b }}`))
  assert.equal(a, optionsParse(`key={ a : b }`), 'single {')

  const answer = { nice: { value: 'nice', cool: 'true', awesome: false } }
  const one = optionsParse(`nice={{ value: nice, cool: "true", awesome: false }}`)
  assert.equal(one, answer)
})

test('Object in quotes is string', () => {
  const a = optionsParse(`key="{ xjsjsj }"`)
  assert.equal(a, {
    key: "{ xjsjsj }"
  }, 'a')
  const b = optionsParse(`key='{ foo:bar }'`)
  assert.equal(b, {
    key: "{ foo:bar }"
  }, 'b')
  const c = optionsParse(`key='{ "foo": "bar" }'`)
  assert.equal(c, {
    key: '{ "foo": "bar" }'
  }, 'c')
  const d = optionsParse(`key='{{ "foo": "bar" }}'`)
  assert.equal(d, {
    key: '{{ "foo": "bar" }}'
  }, 'd')
})

test('Deep object', () => {
  const doubleBracket = `
    foo={{
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }}
  `
  const val = optionsParse(doubleBracket)
  assert.equal(val, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  }, 'doubleBracket')

  const singleBracket = `
    foo={
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  `
  const valTwo = optionsParse(singleBracket)
  assert.equal(valTwo, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello"
        }
      }
    }
  }, 'singleBracket')
})

test('Deep object with quotes', () => {
  const withQuotes = `
    foo={
      "baz": {
        "bar": {
          "fuzz": "hello there",
          "x": ["hello there"]
        }
      }
    }
  `
  const valThree = optionsParse(withQuotes)
  assert.equal(valThree, {
    foo: {
      baz: {
        bar: {
          fuzz: "hello there",
          "x": ["hello there"]
        }
      }
    }
  }, 'withQuotes')
})

test('Simple array', () => {
  const x = { key: [ 1, 2, 3 ] }
  const y = optionsParse(`key=[ 1, 2, 3 ]`)
  assert.equal(x, y)

  const z = optionsParse(`key=[ "1", "2", "3" ]`)
  assert.equal(z, { key: [ "1", "2", "3" ] })

  const a = optionsParse(`key=[ one, two, three ]`)
  assert.equal(a, { key: [ "one", "two", "three" ] })

  const answer = { great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] }
  const one = optionsParse(`great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} `)
  assert.equal(one, answer)
})

test('Complex array with array', () => {
  const a = optionsParse(`
  key=[ true, two, "three", 2, ["nested", "array"], ["nested", "arrayTwo"]]`)
  assert.equal(a, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  })

  const b = optionsParse(`
  key={[ 
    true, 
    two, 
    "three", 
    2, 
    ["nested", "array"], 
    ["nested", "arrayTwo"]
  ]}`)
  assert.equal(b, {
    key: [ 
      true,
      "two",
      "three",
      2,
      ["nested", "array"],
      ["nested", "arrayTwo"]
    ] 
  })
})

test('Complex array with object', () => {
  const a = optionsParse(`
  key=[ true, two, "three", 2, { 
    foo: {
      baz: {
        bar: {
          fuzz: "hello there",
          "x": ["hello there"]
        }
      }
    }
  }]`)
  assert.equal(a, { 
    key: [ 
      true, 
      "two", 
      "three", 
      2, 
      { 
        foo: {
          baz: {
            bar: {
              fuzz: "hello there",
              "x": ["hello there"]
            }
          }
        }
      }
    ] 
  })
})

test('Mixed array syntax', () => {
  const smallExample = `
  lines=[3, 7]
  brackets={[3, 7]}
  bracketsWithStrings={['3', '7']}
  abc=["3", "7", { foo: 'bar' }]
  xyz=['3', '7']
  qwerty=[bob, steve]
  notArray='[]'
  notArrayTwo='[foobar]'
  notArrayThree='["foobar"]'
  notArrayFour='[wrapped, in, quotes]'
  notArrayFive="[wrapped, in, doublequotes]"
  `
  const parsedValue = optionsParse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    lines: [ 3, 7 ],
    brackets: [3, 7],
    bracketsWithStrings: ['3', '7'],
    abc: [ '3', '7', { foo: 'bar' } ], 
    xyz: [ '3', '7' ],
    notArray: '[]',
    notArrayTwo: '[foobar]',
    notArrayThree: '["foobar"]',
    qwerty: [ 'bob', 'steve' ],
    notArrayFour: '[wrapped, in, quotes]',
    notArrayFive: '[wrapped, in, doublequotes]'
  })
})

test('Strings are NOT arrays', () => {
  const smallExample = `
  lines=[3, 7]
  notArray='[]'
  notArrayTwo='[foobar]'
  notArrayThree='["foobar"]'
  notArrayFour='[wrapped, in, quotes]'
  notArrayFive="[wrapped, in, doublequotes]"
  `
  const parsedValue = optionsParse(smallExample)
  //console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    lines: [ 3, 7 ],
    notArray: '[]',
    notArrayTwo: '[foobar]',
    notArrayThree: '["foobar"]',
    notArrayFour: '[wrapped, in, quotes]',
    notArrayFive: '[wrapped, in, doublequotes]'
  })
})

test('oddly "broken" inner quotes', () => {
  const smallExample = `
  x='[foo'bar]'
  y="[foo"bar]"
  z='''''''
  a=""""""" test="foo"
  b='"'"'"'"'
  // c="tons of" weird inner quotes" // this doesnt work
  d="bar"
  `
  const parsedValue = optionsParse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    x: "[foo'bar]",
    y: '[foo"bar]',
    z: "'''''",
    a: '"""""',
    test: "foo",
    b: '"\'"\'"\'"',
    // c: "tons of\" weird inner quotes",
    d: 'bar'
  })
})

test('Single quotes inside double quotes', () => {
  const one = optionsParse(`bob="co'ol" steve="co'ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, {
    bob: "co'ol",
    steve: "co'ol",
  }, 'one')

  const two = optionsParse(`bob='co "ol' steve='co"ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(two, {
    bob: "co \"ol",
    steve: "co\"ol",
  }, 'two')

  const three = optionsParse(`bob="co ol" steve="co ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(three, {
    bob: "co ol",
    steve: "co ol",
  }, 'three')

  const four = optionsParse(`bob='co "ol' steve='co""""ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(four, {
    bob: "co \"ol",
    //steve: "co\"\"\"\"ol",
    steve: 'co""""ol'
  })

  const five = optionsParse(`title='Wow "this" is great'`)
  assert.equal(five, {
    title: 'Wow "this" is great',
  })

  const six = optionsParse(`title="Wow \"this\" is great"`)
  assert.equal(six, {
    title: 'Wow "this" is great',
  })

  const seven = optionsParse(`title='Wow "this" is great'`)
  assert.equal(seven, {
    title: 'Wow "this" is great',
  })

  const eight = optionsParse(`title='Wow \'this\' is great'`)
  assert.equal(eight, {
    title: "Wow 'this' is great",
  })
})

test('Remove single line comments', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool',
  }
  const one = optionsParse(`
  bob = cool
  # Remove this
  joe=cool
  /* Remove this */
  bill="cool"
  // Remove this
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Remove multi line comments', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool',
  }
  const one = optionsParse(`
  bob = cool
  # Remove this
  # And this Remove this
  joe=cool
  // deadOption="foobar"
  /* Remove this 
     and this
     and this too
  */
  bill="cool"
  // Remove this
  // And this
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Remove multi line comments two', () => {
  const answer = { 
    bob: 'cool',
    bill: "cool",
  }
  const one = optionsParse(`
bob = cool
/* 
bobby="rad"
*/
bill="cool"
/* 
 * bobbyTwo="rad"
 */
`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner double quotes', () => {
  const answer = { 
    funny: 'wh"at',
  }
  const one = optionsParse(`
  funny='wh"at'
  `)
  //console.log('parsedValue', one)
  assert.equal(one, answer)
})

test('Handles inner single quotes', () => {
  const answer = { 
    funny: "wh'at",
  }
  const one = optionsParse(`
  funny="wh'at"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner equals =', () => {
  const answer = { 
    funny: "wh=at",
  }
  const one = optionsParse(`
  funny="wh=at"
  `)
  assert.equal(one, answer, 'one')
  const two = optionsParse(`
  funny=wh=at
  `)
  assert.equal(two, answer, 'two')
  const three = optionsParse(`
  funny='wh=at'
  `)
  assert.equal(three, answer, 'three')
})

test('Handles escaped double quotes', () => {
  const answer = { 
    funny: "wh\"at",
  }
  const one = optionsParse(`
  funny="wh\"at",
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles escaped single quotes', () => {
  const answer = { 
    funny: 'wh\'at',
  }
  const one = optionsParse(`
  funny='wh\'at',
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles *', () => {
  const answer = { 
    funny: '*',
    cool: '*!',
    wow: '*-*',
    trill: "**_**",
    haha: "***",
    rad: "*****"
  }
  const one = optionsParse(`
  funny='*'
  cool=*!
  wow=*-*
  trill={**_**}
  haha={{***}}
  rad="*****"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner curly brackets {}', () => {
  const answer = { 
    funny: '${funky}',
    one: "weirdval}}}",
    two: "weirdval}",
    three: "weirdval}",
    four: "weirdval",
    five: "{weirdval",
    six: "{{weirdval}}",
    seven: "{{weirdval}}"
  }
  const one = optionsParse(`
  funny='\${funky}'
  one=weirdval}}}
  two={{weirdval}}}
  three={weirdval}}
  four={{weirdval}}
  five={{{weirdval}}
  six="{{weirdval}}"
  seven='{{weirdval}}'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles inner brackets []', () => {
  const answer = {
    nice: '[whatever]x',
    funny: '[[coool]]',
  }
  const one = optionsParse(`
  nice='[whatever]x'
  funny="[[coool]]"
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
})

test('Handles variable syntax values', () => {
  const one = optionsParse("nice=${file(./foo.js)}")
  assert.equal(one, {
    nice: '${file(./foo.js)}',
  })
  const two = optionsParse("nice='${file(./foo.js)}'")
  assert.equal(two, {
    nice: '${file(./foo.js)}',
  })
  const three = optionsParse(`nice='\${file("./foo.js")}'`)
  assert.equal(three, {
    nice: '${file("./foo.js")}',
  })
  const four = optionsParse(`nice='\${self:custom.stage}'`)
  assert.equal(four, {
    nice: '${self:custom.stage}',
  })
})

test('Handles *', () => {
  const one = optionsParse("what=arn:aws:sns:${self:custom.region}:*:${self:custom.topicName}")
  assert.equal(one, {
    what: 'arn:aws:sns:${self:custom.region}:*:${self:custom.topicName}',
  })
  const two = optionsParse("what=*********")
  assert.equal(two, {
    what: '*********',
  })
})

test('Handles emojis', () => {
  const one = optionsParse(`
  what='😃'
  cool='xyz😃'
  `)
  assert.equal(one, {
    what: '😃',
    cool: 'xyz😃'
  })
})

test('Handles periods', () => {
  const one = optionsParse("what=no.md")
  assert.equal(one, {
    what: 'no.md',
  })
  const two = optionsParse("what='no.md'")
  assert.equal(two, {
    what: 'no.md',
  })
  const three = optionsParse('what="no.md"')
  assert.equal(three, {
    what: 'no.md',
  })
})

test('Handles commas', () => {
  const one = optionsParse("what=no,md")
  assert.equal(one, {
    what: 'no,md',
  })
  const two = optionsParse("what='no,md'")
  assert.equal(two, {
    what: 'no,md',
  })
  const three = optionsParse('what="no,md"')
  assert.equal(three, {
    what: 'no,md',
  })
})


test('Weird ones', () => {
  const one = optionsParse("debug 1")
  assert.equal(one, {
    debug: true,
    1: true,
  })
  const two = optionsParse("_debug 33")
  assert.equal(two, {
    _debug: true,
    33: true,
  })
})

test.run()