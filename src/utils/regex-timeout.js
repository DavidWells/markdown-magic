// https://stackoverflow.com/questions/38859506/cancel-regex-match-if-timeout
const util = require('util')
const vm = require('vm')
const { getBlockRegex } = require('../block-parser')
const { getSyntaxInfo } = require('./syntax')

const goodString = `
# Test Fixture

This is normal text in markdown. <!-- doc-start (wordCount) -->x<!-- doc-end -->
 Keep it.

<!-- doc-start (wordCount) -->
THIS CONTENT GETS AUTO GENERATED. Don't directly edit it
<!-- doc-end -->

This is normal text in markdown. Keep it.
`

const badString = `
# Test Fixture

This is normal text in markdown. <!-- doc-start (wordCount) -->x<!-- oc-end -->
 Keep it.

<!-- doc-start (wordCount) -->
THIS CONTENT GETS AUTO GENERATED. Don't directly edit it
<!-- xoc-end -->

This is normal text in markdown. Keep it.
`

// var pattern = /([ \t]*)(?:<!-{2,}(?:.*|\r?|\n?|\s*)docs-start\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.*?|.*?\r?\n?)*?)<!-{2,}(?:.*|\r?|\n?|\s*)docs-end(?:.|\r?\n)*?-{2,}>/gim

function safeRegex(str) {
  const syntax = 'md'
  const syntaxInfo = getSyntaxInfo(syntax)
  if (!syntaxInfo.pattern) {
    throw new Error(`Unknown syntax "${syntax}"`)
  }
  const [ openComment, closeComment ] = syntaxInfo.pattern
  const pattern = getBlockRegex({
    openComment,
    closeComment,
    openText: 'doc-start',
    closeText: 'doc-end'
  })
  console.log('Pattern', pattern)
  const sandbox = {
    // regex: /([ \t]*)(?:<!-{2,}(?:.*|\r?|\n?|\s*)docs-start\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.*?|.*?\r?\n?)*?)<!-{2,}(?:.*|\r?|\n?|\s*)docs-end(?:.|\r?\n)*?-{2,}>/gim,
    regexToUse: pattern,
    string: str,
    //string: badStringTwo,
    //string: string,
  }

  const context = vm.createContext(sandbox)
  console.log('Sandbox initialized: ' + vm.isContext(sandbox))
  // var script = new vm.Script('result = regex.exec(string)');
  const script = new vm.Script(`
    blocks = []
    rawMatches = string.match(regexToUse)
    while ((list = regexToUse.exec(string)) !== null) {
      const [ block, spaces, __type, params ] = list
      blocks.push({
        __type,
        block
      })
      if (list.index === regexToUse.lastIndex) regexToUse.lastIndex++
    }
  `);
  try {
    // One could argue if a RegExp hasn't processed in a given time.
    // then, its likely it will take exponential time.
    script.runInContext(context, { timeout: 1000 }); // milliseconds
  } catch (e) {
    console.log('ReDos occurred', e); // Take some remedial action here...
  }
  console.log('result:')
  console.log(util.inspect(sandbox)); // Check the results
}

// safeRegex(goodString)
safeRegex(badString)