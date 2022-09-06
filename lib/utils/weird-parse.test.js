const { test } = require('uvu') 
const assert = require('uvu/assert')
const weirdParse = require('./weird-parse')

const stringExample = `abc=yo foo=bar baz='hello' bim='boop dop' fizz="pop" pow="bang bang"`
test('string test', () => {
  const parsedValue = weirdParse(stringExample)
  console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    abc: 'yo',
    foo: 'bar',
    baz:'hello', 
    bim:'boop dop',
    fizz: "pop",
    pow: "bang bang"
  })
})

const stringExampleWithBoolean = `abc=yo foo=bar bim='boop dop' boo=true`
test('string test two', () => {
  const parsedValue = weirdParse(stringExampleWithBoolean)
  console.log('parsedValue', parsedValue)
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
 cool=true notCool=false
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
  const parsedValue = weirdParse(bigExample)
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
      chill: 'https://app.netlify.com/start/deploy?repositoryhttps://github.com/netlify/netlify-faunadb-example&stackfauna',
      pill: [ 'yo' ]
    },
    href: 'https://fooo.com/start/deploy?repositoryhttps://github.com/netlify/netlify-faunadb-example&stackfauna',
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
  const parsedValue = weirdParse(testSpacing)
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
    href: 'https://fooo.com/start/deploy?repositoryhttps://github.com/netlify/netlify-faunadb-example&stackfauna',
    src: 'https://user-images.github{user}content.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg',
    deep: { rad: 'blue', what: { nice: 'cool', wow: { deep: true } } }
  }, 'matches original')
})

test('Single line', () => {
  const parsedValue = weirdParse(`width={999} height={{111}} numberAsString="12345" great={["scoot", "sco ot", 'scooo ttt']} nice={{ value: nice, cool: "true" }} soclose=[jdjdjd, hdhfhfhffh] rad="boss" cool=true isCool notCool=false nooooo={[one, two, 3, 4]}`)
  console.log('parsedValue', parsedValue)
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
  const parsedValue = weirdParse(`bob='cool'`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (double quotes)', () => {
  const parsedValue = weirdParse(`bob="cool"`)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (no quotes)', () => {
  const parsedValue = weirdParse(`bob=cool`)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    bob: 'cool',
  })
})

test('Simple string equal (no quotes with spaces)', () => {
  const answer = { bob: 'cool' }
  const one = weirdParse(`bob = cool`)
  const two = weirdParse(`bob= cool`)
  const three = weirdParse(`bob =cool`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
})

test('Simple strings mixed', () => {
  const answer = { 
    bob: 'cool',
    joe: 'cool',
    bill: "cool",
    steve: 'cool' 
  }
  const one = weirdParse(`
  bob = cool
  joe=cool
  bill="cool"
  steve='cool'
  `)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, answer)

  const two = weirdParse(`bob = cool joe=cool bill="cool" steve='cool'`)
  assert.equal(two, answer)
})

test('Simple numbers', () => {
  const one = weirdParse(`isCool=20`)
  assert.equal(one, { isCool: 20 })

  const two = weirdParse(`isCool=20.2`)
  assert.equal(two, { isCool: 20.2 })

  const three = weirdParse(`isCool={20.2}`)
  assert.equal(three, { isCool: 20.2 })

  const four = weirdParse(`isCool={{20.2}}`)
  assert.equal(four, { isCool: 20.2 })

  const five = weirdParse(`isCool=0`)
  assert.equal(five, { isCool: 0 })

  const sixAsString = weirdParse(`isCool="0"`)
  assert.equal(sixAsString, { isCool: "0" })

  const decimal = weirdParse(`isCool=0.22`)
  assert.equal(decimal, { isCool: 0.22 })
})

test('Simple boolean', () => {
  const answer = { isCool: true }
  const one = weirdParse(`isCool`)
  const two = weirdParse(`isCool = true`)
  const three = weirdParse(`isCool =true`)
  const four = weirdParse(`isCool=true`)
  const fourx = weirdParse(`isCool={true}`)
  const foury = weirdParse(`isCool={{true}}`)

  assert.equal(one, answer)
  assert.equal(two, answer)
  assert.equal(three, answer)
  assert.equal(four, answer)
  assert.equal(fourx, answer)
  assert.equal(foury, answer)

  const answerTwo = { isNotCool: false }
  const five = weirdParse(`isNotCool=false`)
  const six = weirdParse(`isNotCool = false`)
  const seven = weirdParse(`isNotCool =false`)
  const eight = weirdParse(`isNotCool=false`)
  const nine = weirdParse(`isNotCool= false`)
  const ten = weirdParse(`isNotCool={false}`)
  const eleven = weirdParse(`isNotCool={{false}}`)
  
  assert.equal(five, answerTwo, 'five')
  assert.equal(six, answerTwo, 'six')
  assert.equal(seven, answerTwo, 'seven')
  assert.equal(eight, answerTwo, 'eight')
  assert.equal(nine, answerTwo, 'nine')
  assert.equal(ten, answerTwo, 'ten')
  assert.equal(eleven, answerTwo, 'eleven')
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
  const one = weirdParse(`
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
  assert.equal(a, weirdParse(`key={{ "a": "b" }}`))
  assert.equal(a, weirdParse(`key={{ "a": b }}`))
  assert.equal(a, weirdParse(`key={{ a: "b" }}`))
  assert.equal(a, weirdParse(`key={{ a: b }}`))
  assert.equal(a, weirdParse(`key={ a : b }`), 'single {')

  const answer = { nice: { value: 'nice', cool: 'true', awesome: false } }
  const one = weirdParse(`nice={{ value: nice, cool: "true", awesome: false }}`)
  assert.equal(one, answer)
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
  const val = weirdParse(doubleBracket)
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
  const valTwo = weirdParse(singleBracket)
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
  const valThree = weirdParse(withQuotes)
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
  const y = weirdParse(`key=[ 1, 2, 3 ]`)
  assert.equal(x, y)

  const z = weirdParse(`key=[ "1", "2", "3" ]`)
  assert.equal(z, { key: [ "1", "2", "3" ] })

  const a = weirdParse(`key=[ one, two, three ]`)
  assert.equal(a, { key: [ "one", "two", "three" ] })

  const answer = { great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] }
  const one = weirdParse(`great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} `)
  assert.equal(one, answer)
})

test('Mixed array syntax', () => {
  const smallExample = `
  lines=[3, 7]
  brackets={[3, 7]}
  bracketsWithStrings={['3', '7']}
  abc=["3", "7"]
  xyz=['3', '7']
  qwerty=[bob, steve]
  `
  const parsedValue = weirdParse(smallExample)
  // console.log('parsedValue', parsedValue)
  assert.equal(parsedValue, {
    lines: [ 3, 7 ],
    brackets: [3, 7],
    bracketsWithStrings: ['3', '7'],
    abc: [ '3', '7' ], 
    xyz: [ '3', '7' ],
    qwerty: [ 'bob', 'steve' ]
  })
})

test('Single quotes inside double quotes', () => {
  const one = weirdParse(`bob="co'ol" steve="co'ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(one, {
    bob: "co'ol",
    steve: "co'ol",
  }, 'one')

  const two = weirdParse(`bob='co "ol' steve='co"ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(two, {
    bob: "co \"ol",
    steve: "co\"ol",
  }, 'two')

  const three = weirdParse(`bob="co ol" steve="co ol"`)
  // console.log('parsedValue', parsedValue)
  assert.equal(three, {
    bob: "co ol",
    steve: "co ol",
  }, 'three')

  const four = weirdParse(`bob='co "ol' steve='co""""ol'`)
  // console.log('parsedValue', parsedValue)
  assert.equal(four, {
    bob: "co \"ol",
    //steve: "co\"\"\"\"ol",
    steve: 'co""""ol'
  })

  const five = weirdParse(`title='Wow "this" is great'`)
  assert.equal(five, {
    title: 'Wow "this" is great',
  })

  const six = weirdParse(`title="Wow \"this\" is great"`)
  assert.equal(six, {
    title: 'Wow "this" is great',
  })

  const seven = weirdParse(`title='Wow "this" is great'`)
  assert.equal(seven, {
    title: 'Wow "this" is great',
  })

  const eight = weirdParse(`title='Wow \'this\' is great'`)
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
  const one = weirdParse(`
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
  const one = weirdParse(`
  bob = cool
  # Remove this
  # And this Remove this
  joe=cool
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

test.run()