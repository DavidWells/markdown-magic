# Test Fixture

This is normal text in markdown. Keep it.

<!-- docs CODE src='../local-code-file.js' syntax='js' -->
```js
const html = {
  tags: [
    '<!--', 
    '-->'
  ],
  pattern: [
    '<!-{2,}', 
    '-{2,}>' // '-->'
  ],
}

module.exports.run = () => {
  const time = new Date()
  console.log(`Your cron ran ${time}`)
}
```
<!-- /docs -->

<!-- docs CODE src='../local-code-file-lines.js' syntax='js' lines='4-5' -->
```js
  const baz = 'foobar'
  console.log(`Hello ${baz}`)
```
<!-- /docs -->

<!-- docs CODE src=https://raw.githubusercontent.com/DavidWells/awesome-stoicism/master/scripts/generate.js -->
```js
const fs = require('fs')
const path = require('path')
const markdownMagic = require('markdown-magic')

const MARKDOWN_PATH = path.join(__dirname, '..', 'README.md')
const QUOTES_PATH = path.join(__dirname, '..', 'quotes.json')
const QUOTES = JSON.parse(fs.readFileSync(QUOTES_PATH, 'utf8'))

const mdConfig = {
  transforms: {
    /* Usage example in markdown:
      <!-- AUTO-GENERATED-CONTENT:START (GENERATE_QUOTE_LIST)-->
        quote will be generated here
      <!-- AUTO-GENERATED-CONTENT:END -->
     */
    GENERATE_QUOTE_LIST: function(content, options) {
      let md = ''
      QUOTES.sort(sortByAuthors).forEach((data) => {
        md += `- **${data.author}** ${data.quote}\n`
      })
      return md.replace(/^\s+|\s+$/g, '')
    }
  }
}

/* Utils functions */
function sortByAuthors(a, b) {
  const aName = a.author.toLowerCase()
  const bName = b.author.toLowerCase()
  return aName.localeCompare(bName)
}

markdownMagic(MARKDOWN_PATH, mdConfig, () => {
  console.log('quotes', QUOTES.length)
  console.log('Docs updated!')
})
```
<!-- /docs -->

<!-- docs 
  CODE 
  src=https://raw.githubusercontent.com/DavidWells/awesome-stoicism/master/package.json
  lines=3-4 
-->
```json
  "private": true,
  "version": "1.0.0",
```
<!-- /docs -->

<!-- docs CODE src='../local-code-file-lines.js' syntax='js' lines='4-5' -->
```js
  const baz = 'foobar'
  console.log(`Hello ${baz}`)
```
<!-- /docs -->

<!-- docs (CODE:src=../local-code-file.js&syntax=js) -->
```js
const html = {
  tags: [
    '<!--', 
    '-->'
  ],
  pattern: [
    '<!-{2,}', 
    '-{2,}>' // '-->'
  ],
}

module.exports.run = () => {
  const time = new Date()
  console.log(`Your cron ran ${time}`)
}
```
<!-- /docs -->

<!-- docs (CODE:src=../local-code-file-lines.js&syntax=js&lines=4-5) -->
```js
  const baz = 'foobar'
  console.log(`Hello ${baz}`)
```
<!-- /docs -->

<!-- docs (CODE:src=https://raw.githubusercontent.com/DavidWells/awesome-stoicism/master/scripts/generate.js) -->
```js
const fs = require('fs')
const path = require('path')
const markdownMagic = require('markdown-magic')

const MARKDOWN_PATH = path.join(__dirname, '..', 'README.md')
const QUOTES_PATH = path.join(__dirname, '..', 'quotes.json')
const QUOTES = JSON.parse(fs.readFileSync(QUOTES_PATH, 'utf8'))

const mdConfig = {
  transforms: {
    /* Usage example in markdown:
      <!-- AUTO-GENERATED-CONTENT:START (GENERATE_QUOTE_LIST)-->
        quote will be generated here
      <!-- AUTO-GENERATED-CONTENT:END -->
     */
    GENERATE_QUOTE_LIST: function(content, options) {
      let md = ''
      QUOTES.sort(sortByAuthors).forEach((data) => {
        md += `- **${data.author}** ${data.quote}\n`
      })
      return md.replace(/^\s+|\s+$/g, '')
    }
  }
}

/* Utils functions */
function sortByAuthors(a, b) {
  const aName = a.author.toLowerCase()
  const bName = b.author.toLowerCase()
  return aName.localeCompare(bName)
}

markdownMagic(MARKDOWN_PATH, mdConfig, () => {
  console.log('quotes', QUOTES.length)
  console.log('Docs updated!')
})
```
<!-- /docs -->

<!-- docs (CODE:src=https://raw.githubusercontent.com/DavidWells/awesome-stoicism/master/package.json&lines=3-4) -->
```json
  "private": true,
  "version": "1.0.0",
```
<!-- /docs -->

This is normal text in markdown. Keep it.