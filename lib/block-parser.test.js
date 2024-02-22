const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseBlocks } = require('./block-parser')
const { deepLog } = require('./utils/logs')

const md = `<h1 id="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; 
 <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">
   <img src="https://www.netlify.com/img/deploy/button.svg">
 </a>
</h1>

<\!-- XYZ:START functionName foo={{ rad: 'yellow' }} -->
nice
<\!-- XYZ:END -->

<\!-- XYZ:START {functionName} foo={{ rad: 'blue' }} -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START {functionName} foo={{ rad: 'red' }} -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START [wootName] foo=['one', 'two'] -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START -->
lol
<\!-- XYZ:END -->

<!-- XYZ:START funky-key-here kldskjfjslfjs -->
lol
<!-- XYZ:END -->

<\!-- xyz:start (lowerCase) foo=['one', 'two'] heading=false -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START(cool) 
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

<\!-- XYZ:END -->


<img src="https://www.netlify.com/img/deploy/button.svg"/>


<img src="https://www.hehhehehehe.com/img/deploy/button.svg" />


<\!-- XYZ:START(cool) xxx
hhddh=cool -->
wowow
whatever we want 
<\!-- XYZ:END -->


<\!-- XYZ:START(hhh) -->
xyz
<\!-- XYZ:END -->


<\!-- XYZ:START(cool) isCool -->
nice
<\!-- XYZ:END -->


<button 
 great={[one, two, 3, 4]}
>
 wow
</button>


<\!-- XYZ:START(niceeeee) 
  xxx
  // comment here
  hhddh=cool 
-->
contents
<\!-- XYZ:END -->

<button 
 width={999} 
 great={["scoot", "scoot"]} 
 nice={{ value: nice, cool: true }}
 rad="boss" 
 cool=true 
 nope=false 
 what='xnxnx' 
 isLoading 
 src="https://user-images.githubusercontent.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
>
 coooooll
</button>


<hr />


<br />


<ReactComponent>lolol</ReactComponent>


<ReactComponent width={123} lol={["no", "cool"]}>
 lolol
</ReactComponent>


<OtherComponent width={123} lol={["no", "cool"]} nice={{ value: "nice", cool: true }}>
 lolol
</OtherComponent>


<table style="width:100%">
 <tr>
   <th>Firstname</th>
   <th>Lastname</th>
   <th>Age</th>
 </tr>
 <tr>
   <td>Jill</td>
   <td>Smith</td>
   <td>50</td>
 </tr>
 <tr>
   <td>Eve</td>
   <td>Jackson</td>
   <td>94</td>
 </tr>
</table>


<div>
 <p>
   <img align="right" isLoading={false} width="250" src="https://user-images.githubusercontent.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg" />
 </p>
 <p>
  cool
 </p>
<div>


<p>
 <img align="left" width="250" src="https://user-images.githubusercontent.com/532272/123136889-4953fd00-d408-11eb-8a3e-f82f1d073298.jpg" />
</p>


 Add a little magic to your markdown 


## About


<img align="right" width="200" height="183" src="https://cloud.githubusercontent.com/assets/532272/21507867/3376e9fe-cc4a-11e6-9350-7ec4f680da36.gif" />Markdown magic uses comment blocks in markdown files to automatically sync or transform its contents.


Markdown magic uses comment blocks in markdown files to automatically sync or transform its contents. <img align="right" width="200" height="183" src="https://cloud.githubusercontent.com/assets/532272/21507867/3376e9fe-cc4a-11e6-9350-7ec4f680da36.gif" />
`

test('verify parser', () => {
  const parsedValue = parseBlocks(md, {
    open: 'XYZ:START',
    close: 'XYZ:END'
  })
  /*
  console.log('parsedValue')
  deepLog(parsedValue)
  // process.exit(1)
  /** */
  assert.equal(typeof parsedValue, 'object')
  assert.equal(parsedValue.blocks.length, 11)
})

test('inline parser', () => {
  const inlineOne = `<!--XYZ:START functionName foo={{ rad: 'bar' }}-->99<!--XYZ:END-->`
  const one = parseBlocks(inlineOne, {
    open: 'XYZ:START',
    close: 'XYZ:END'
  })
  /*
  console.log('inline one')
  deepLog(one)
  /** */
  const values = [
    {
      type: 'functionName',
      options: { foo: { rad: 'bar' } },
      location: 66
    }
  ]
  values.forEach((val, i) => {
    const stub = val
    const currentItem = one.blocks[i]
    assert.equal(stub.type, currentItem.type, `${stub.type} ${i} transform`)
    assert.equal(stub.options, currentItem.options, `${stub.type} ${i} options`)
  })

  const inlineTwo = ` <!-- XYZ:START transformX foo=111 -->99<!-- XYZ:END -->`
  const two = parseBlocks(inlineTwo, {
    open: 'XYZ:START',
    close: 'XYZ:END'
  })
  /*
  console.log('inline two ───────────────────────')
  deepLog(two)
  /** */
  const valuesTwo = [
    { 
      type: 'transformX', 
      options: { foo: 111 }, 
      location: 55 
    }
  ]
  valuesTwo.forEach((val, i) => {
    const stub = val
    const currentItem = two.blocks[i]
    assert.equal(stub.type, currentItem.type, `${stub.type} ${i} transform`)
    assert.equal(stub.options, currentItem.options, `${stub.type} ${i} options`)
  })
})

const fnBlocks = `
<!-- XYZ:START functionName foo={{ rad: 'yellow' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START {functionName} foo={{ rad: 'blue' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START (functionName) foo={{ rad: 'red' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START [functionName] foo={{ rad: 'purple' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START {{functionName}} foo={{ rad: 'black' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START ((functionName)) foo={{ rad: 'white' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START [[functionName]] foo={{ rad: 'orange' }} -->
nice
<!-- XYZ:END -->
`

test('Handles function names', () => {
  const parsedValue = parseBlocks(fnBlocks, {
    open: 'XYZ:START',
    close: 'XYZ:END'
  })
  /*
  console.log('fn names')
  deepLog(parsedValue)
  /** */
  assert.equal(Array.isArray(parsedValue.blocks), true)
  assert.equal(parsedValue.blocks.length, 7)

  const values = [
    {
      type: 'functionName',
      options: { foo: { rad: 'yellow' } },
      location: 78
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'blue' } },
      location: 157
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'red' } },
      location: 235
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'purple' } },
      location: 316
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'black' } },
      location: 398
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'white' } },
      location: 480
    },
    {
      type: 'functionName',
      options: { foo: { rad: 'orange' } },
      location: 563
    }
  ]

  values.forEach((val, i) => {
    const stub = val
    const currentItem = parsedValue.blocks[i]
    assert.equal(stub.type, currentItem.type, `${stub.type} ${i} transform`)
    assert.equal(stub.options, currentItem.options, `${stub.type} ${i} options`)
  })
})


test('different function names', () => {
  const backwardCompat = `
<!-- XYZ:START functionName foo={{ rad: 'yellow' }} -->
nice
<!-- XYZ:END -->

<!-- XYZ:START lol width={999}
  height={{111}}
  numberAsString="12345"
  great={["scoot", "sco ot", 'scooo ttt']}
  nope=false -->
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna. Suspendisse potenti. Quisque eget massa a massa semper mollis.
<!-- XYZ:END -->

<!-- XYZ:START (CODE:src=./relative/path/to/code.js&lines=22-44) -->
This content will be dynamically replaced with code from the file lines 22 through 44
<!-- XYZ:END -->
`
  const parsedValue = parseBlocks(backwardCompat, {
    open: 'XYZ:START',
    close: 'XYZ:END'
  })
  /*
  console.log('backwardCompat')
  deepLog(parsedValue)
  /** */
  const answers = [
    {
      type: 'functionName',
      options: { foo: { rad: 'yellow' } },
    },
    {
      type: 'lol',
      options: {
        width: 999,
        height: 111,
        numberAsString: '12345',
        great: [ 'scoot', 'sco ot', 'scooo ttt' ],
        nope: false
      },
    },
    {
      type: 'CODE',
      options: { src: './relative/path/to/code.js', lines: '22-44' },
    },
  ]
  parsedValue.blocks.forEach((transform, i) => {
    const stub = answers[i]
    assert.equal(transform.type, stub.type, `type: ${stub.type} at index ${i}`)
    assert.equal(transform.options, stub.options, `options: ${stub.type} at index ${i}`)
  })
})

const defaultOpts = {
  syntax: 'md',
  open: 'DOCS:START',
  close: 'DOCS:END',
}

const mdText = `
Very nice

<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>
ok
<!-- DOCS:END -->

<!-- DOCS:START (CODE:src=./relative/path/to/code.js&lines=22-44) -->
This content will be dynamically replaced with code from the file lines 22 through 44
<!-- DOCS:END -->
`

test('Parse md blocks', () => {
  const parsedValue = parseBlocks(mdText, defaultOpts)
  /*
  deepLog(parsedValue)
  /** */
  assert.equal(parsedValue.blocks,  [
    {
      index: 1,
      type: 'TOC',
      options: { foo: { rad: 'orange' } },
      context: { isMultiline: true },
      open: {
        value: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n",
        start: 12,
        end: 65
      },
      content: { value: 'ok', start: 65, end: 67, indentation: 0 },
      close: { value: '\n<!-- DOCS:END -->', start: 67, end: 85 },
      block: {
        indentation: '',
        lines: [ 4, 6 ],
        start: 12,
        end: 85,
        rawArgs: "foo={{ rad: 'orange' }}",
        rawContent: 'ok',
        value: "<!-- DOCS:START(TOC) foo={{ rad: 'orange' }} ------>\n" +
          'ok\n' +
          '<!-- DOCS:END -->'
      }
    },
    {
      index: 2,
      type: 'CODE',
      options: { src: './relative/path/to/code.js', lines: '22-44' },
      context: { isMultiline: true, isLegacy: true },
      open: {
        value: '<!-- DOCS:START (CODE:src=./relative/path/to/code.js&lines=22-44) -->\n',
        start: 87,
        end: 157
      },
      content: {
        value: 'This content will be dynamically replaced with code from the file lines 22 through 44',
        start: 157,
        end: 242,
        indentation: 0
      },
      close: { value: '\n<!-- DOCS:END -->', start: 242, end: 260 },
      block: {
        indentation: '',
        lines: [ 8, 10 ],
        start: 87,
        end: 260,
        rawArgs: 'src=./relative/path/to/code.js&lines=22-44',
        rawContent: 'This content will be dynamically replaced with code from the file lines 22 through 44',
        value: '<!-- DOCS:START (CODE:src=./relative/path/to/code.js&lines=22-44) -->\n' +
          'This content will be dynamically replaced with code from the file lines 22 through 44\n' +
          '<!-- DOCS:END -->'
      }
    }
  ], 'Array contains details')
})

test('Returns empty array', () => {
  assert.equal(parseBlocks('', defaultOpts).blocks, [])
  assert.equal(parseBlocks(' ', defaultOpts).blocks, [])
  assert.equal(parseBlocks(`
  
  
  `, defaultOpts).blocks, [])
  assert.equal(parseBlocks(`
# No block in here

nope  
  `, defaultOpts).blocks, [])
})

test.run()