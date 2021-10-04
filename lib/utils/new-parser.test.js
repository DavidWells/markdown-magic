const { test } = require('uvu') 
const assert = require('uvu/assert')
const weirdParse = require('./weird-parse')
const parser = require('./new-parser')

const md = `<h1 id="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; 
 <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">
   <img src="https://www.netlify.com/img/deploy/button.svg">
 </a>
</h1>


<\!-- XYZ:START {functionName} foo={{ rad: 'blue' }} -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START [wootName] foo=['one', 'two'] -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START -->
lol
<\!-- XYZ:END -->


<\!-- xyz:start (lowerCase) foo=['one', 'two'] heading=false -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START(cool) -->
nice
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

test.only('parser', () => {
  const parsedValue = parser(md)
  console.log('parsedValue', parsedValue)
  assert.equal(true, true)
})

test.run()