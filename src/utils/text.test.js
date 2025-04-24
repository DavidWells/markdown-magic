const { test } = require('uvu')
const assert = require('uvu/assert')
const { stripComments, dedentString, convertCommentSyntax } = require('./text')
const { deepLog } = require('./logs')

const md = `<h1 id="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; 
 <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">
   <img src="https://www.netlify.com/img/deploy/button.svg">
 </a>
</h1>

foo o     <!-- XYZ:START functionName foo={{ rad: 'yellow' }} -->

nice
<!-- XYZ:END -->

<!-- XYZ:START functionName foo={{ rad: 'yellow' }} -->
wooooooo
<!-- XYZ:END -->

<!-- XYZ:START {functionName} foo={{ rad: 'blue' }} -->
cool
<!-- XYZ:END -->

<!-- XYZ:START {functionName} foo={{ rad: 'red' }} -->
rad
<!-- XYZ:END -->


<!-- XYZ:START [wootName] foo=['one', 'two'] -->
nice
<!-- XYZ:END -->


<!-- XYZ:START -->
lol
<!-- XYZ:END -->


<!-- xyz:start (lowerCase) foo=['one', 'two'] heading=false -->
nice
<!-- XYZ:END -->


<!-- XYZ:START(cool) 
 width={999} 
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
 yes={true} -->

actual content

<!-- XYZ:END -->


<img src="https://www.netlify.com/img/deploy/button.svg"/>


<img src="https://www.hehhehehehe.com/img/deploy/button.svg" />


<!-- XYZ:START(cool) xxx
hhddh=cool -->
wowow
whatever we want 
<!-- XYZ:END -->


<!-- XYZ:START(hhh) -->
xyz
<!-- XYZ:END -->


<!-- XYZ:START(cool) isCool -->
nice
<!-- XYZ:END -->

`

test('Remove Markdown comments', () => {
  const parsedValue = stripComments(md, 'md')
  /*
  console.log('parsedValue')
  logOutput(parsedValue)
  /** */
  assert.equal(typeof parsedValue, 'string')
  assert.equal(parsedValue.match(/-->/), null)
  assert.equal(parsedValue.match(/<!--/), null)
  assert.equal(parsedValue.split('\n'), [
    '<h1 id="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; ',
    ' <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">',
    '   <img src="https://www.netlify.com/img/deploy/button.svg">',
    ' </a>',
    '</h1>',
    '',
    'foo o',
    '',
    'nice',
    '',
    'wooooooo',
    '',
    'cool',
    '',
    'rad',
    '',
    '',
    'nice',
    '',
    '',
    'lol',
    '',
    '',
    'nice',
    '',
    '',
    '',
    'actual content',
    '',
    '',
    '',
    '<img src="https://www.netlify.com/img/deploy/button.svg"/>',
    '',
    '',
    '<img src="https://www.hehhehehehe.com/img/deploy/button.svg" />',
    '',
    '',
    'wowow',
    'whatever we want ',
    '',
    '',
    'xyz',
    '',
    '',
    'nice',
    '',
    ''
  ])
})

test('Remove Javascript comments', () => {
  const parsedValue = stripComments(`
/*
Fooo bar
*/
console.log('cool')
console.log('multiline')/*
weird one
*/
console.log('inline') /* inline klsjlkajdsalkjd *****/

/* inline */
console.log('nice')
`, 'js')
  /*
  console.log('parsedValue')
  logOutput(parsedValue)
  /** */
  assert.equal(typeof parsedValue, 'string')
  assert.equal(parsedValue.match(/\/\*/), null)
  assert.equal(parsedValue.match(/\*\//), null)
  assert.equal(parsedValue.split('\n'), [
    '',
    "console.log('cool')",
    "console.log('multiline')",
    "console.log('inline')",
    '',
    "console.log('nice')",
    ''
  ])
})

test('Remove YAML comments', () => {
  const parsedValue = stripComments(`
  bob: cool
  # Remove this
  # And this Remove this
  joe: cool
  bill: "cool"
  ## Remove this
  ## And this
  steve: 'cool' # inline comment
  foo:
    bar: lol
`, 'yml')

  /*
  console.log('yml', dedentString(parsedValue))
  console.log('parsedValue')
  // deepLog(parsedValue)
  logOutput(parsedValue)
  /** */
  assert.equal(typeof parsedValue, 'string')
  assert.equal(parsedValue.match(/#/), null)
  assert.equal(parsedValue.split('\n'), [
    '',
    '  bob: cool',
    '  joe: cool',
    '  bill: "cool"',
    "  steve: 'cool'",
    '  foo:',
    '    bar: lol',
    ''
  ])
})

test('Convert comment syntax', () => {
  const yml = `
  bob: cool
  # Remove this
  # And this Remove this
  joe: cool
  bill: "cool"
  ## Remove this
  ## And this
  steve: 'cool' # inline comment
  foo:
    bar: lol
`
  const jsx = convertCommentSyntax(yml, {
    from: 'yml',
    to: 'jsx'
  })
  // logOutput(jsx)

  assert.equal(jsx.split('\n'), [
    '',
    '  bob: cool',
    '  {/* Remove this */}',
    '  {/* And this Remove this */}',
    '  joe: cool',
    '  bill: "cool"',
    '  {/* Remove this */}',
    '  {/* And this */}',
    "  steve: 'cool' {/* inline comment */}",
    '  foo:',
    '    bar: lol',
    ''
  ])

  const js = convertCommentSyntax(yml, {
    from: 'yml',
    to: 'js'
  })
  // logOutput(js)

  assert.equal(js.split('\n'), [
    '',
    '  bob: cool',
    '  /* Remove this */',
    '  /* And this Remove this */',
    '  joe: cool',
    '  bill: "cool"',
    '  /* Remove this */',
    '  /* And this */',
    "  steve: 'cool' /* inline comment */",
    '  foo:',
    '    bar: lol',
    ''
  ])

  const html = convertCommentSyntax(yml, {
    from: 'yml',
    to: 'html'
  })
  // logOutput(html)

  assert.equal(html.split('\n'), [
    '',
    '  bob: cool',
    '  <!-- Remove this -->',
    '  <!-- And this Remove this -->',
    '  joe: cool',
    '  bill: "cool"',
    '  <!-- Remove this -->',
    '  <!-- And this -->',
    "  steve: 'cool' <!-- inline comment -->",
    '  foo:',
    '    bar: lol',
    ''
  ])

  // //*
  // console.log('parsedValue')
  // // deepLog(parsedValue)
  // logOutput(parsedValue)
  // /** */
  // assert.equal(typeof parsedValue, 'string')
})


function logOutput(value) {
  console.log(value.split('\n'))
}

test.run()