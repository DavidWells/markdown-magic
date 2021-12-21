const { test } = require('uvu') 
const assert = require('uvu/assert')
const weirdParse = require('./weird-parse')


const bigExample = `width={999} 
  height={{111}}
  numberAsString="12345"   
 great={["scoot", "sco ot", 'scooo ttt']} 
 nice={{ value: nice, cool: "true" }}
 soclose=[jdjdjd, hdhfhfhffh]
 rad="boss"
 cool=true notCool=false
 nooooo={[one, two, 3, 4]}
 numberZero=0,
 xyz=999,
 nope=false,
 // comment
 yes={true}
 isWhat,
 /* comment */
 foo={{ rad: ["whatever", "man"], cool: { beans: 'here' } }}
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
    numberZero: 0,
    xyz: 999,
    nope: false,
    yes: true,
    isWhat: true,
    foo: { rad: [ 'whatever', 'man' ], cool: { beans: 'here' } },
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

test('Simple object', () => {
  const answer = { nice: { value: 'nice', cool: 'true', awesome: false } }
  const one = weirdParse(`nice={{ value: nice, cool: "true", awesome: false }}`)
  assert.equal(one, answer)
})

test('Simple array', () => {
  const answer = { great: [ 'scoot', 'sco ot', 'scooo ttt', 'one', 'two', 3, 4, true ] }
  const one = weirdParse(`great={["scoot", "sco ot", 'scooo ttt', one, two, 3, 4, true]} `)
  assert.equal(one, answer)
})

test.run()