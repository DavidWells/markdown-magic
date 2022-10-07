// https://stackoverflow.com/questions/38859506/cancel-regex-match-if-timeout
const util = require('util');
const vm = require('vm');

const string = `
# Test Fixture

This is normal text in markdown. <!-- docs-start (wordCount) -->x<!-- docs-end -->
 Keep it.

<!-- docs-start (wordCount) -->
THIS CONTENT GETS AUTO GENERATED. Don't directly edit it
<!-- AUTO-GENERATED-CONTENT:END -->

This is normal text in markdown. Keep it.
`

const badString = `
# Test Fixture

This is normal text in markdown. <!-- docs-start (wordCount) -->x<!-- ocs-end -->
 Keep it.

<!-- docs-start (wordCount) -->
THIS CONTENT GETS AUTO GENERATED. Don't directly edit it
<!-- AUTO-GENERATED-CONTENT:END -->

This is normal text in markdown. Keep it.
`

const badStringTwo = `
# Test Fixture

This is normal text in markdown.
 Keep it.

THIS CONTENT GETS AUTO GENERATED. Don't directly edit it

This is normal text in markdown. Keep it.
`

var sandbox = {
  regex: /([ \t]*)(?:<!-{2,}(?:.*|\r?|\n?|\s*)docs-start\s*([(\[\{]*[A-Za-z0-9_$-]*[)\]\}]*)\s*)((?:.*?|.*?\r?\n?)*?)<!-{2,}(?:.*|\r?|\n?|\s*)docs-end(?:.|\r?\n)*?-{2,}>/gim,
  string: badString,
  //string: badStringTwo,
  //string: string,
}

var context = vm.createContext(sandbox);
console.log('Sandbox initialized: ' + vm.isContext(sandbox));
// var script = new vm.Script('result = regex.exec(string)');
var script = new vm.Script(`
  blocks = []
  while ((commentMatches = regex.exec(string)) !== null) {
    const [ block, spaces, __type, params ] = commentMatches
    blocks.push(block)

    // This is necessary to avoid infinite loops
    if (commentMatches.index === regexToUse.lastIndex) {
      regexToUse.lastIndex++
    }
  }
`);


try {
  // One could argue if a RegExp hasn't processed in a given time.
  // then, its likely it will take exponential time.
  script.runInContext(context, { timeout: 1000 }); // milliseconds
} catch(e){
  console.log('ReDos occurred', e); // Take some remedial action here...
}

console.log('result:')
console.log(util.inspect(sandbox)); // Check the results