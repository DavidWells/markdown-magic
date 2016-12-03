# Test Fixture

This is normal text in markdown. Keep it.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./local-code-file.js&syntax=js) -->
<!-- The below code snippet is automatically added from ./local-code-file.js -->
```js
module.exports.run = () => {
  const time = new Date()
  console.log(`Your cron ran ${time}`)
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=https://raw.githubusercontent.com/DavidWells/markdown-magic/master/example/generate-readme.js) -->
<!-- The below code snippet is automatically added from https://raw.githubusercontent.com/DavidWells/markdown-magic/master/example/generate-readme.js -->
```js
const fs = require('fs')
const path = require('path')
const dox = require('dox')
const execSync = require('child_process').execSync
// require('markdown-steriods') lib
const markdownSteriods = require('../index')

const config = {
  commands: {
    /* Update the content in comment in .md matching
       AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE)
    */
    customTransform: function(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Update the content in comment in .md matching
      AUTO-GENERATED-CONTENT (RENDERDOCS:path=../file.js)
    */
    RENDERDOCS: function(content, options) {
      const filePath = path.join(__dirname, options.path)
      const contents = fs.readFileSync(filePath, 'utf8')
      const docBlocs = dox.parseComments(contents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach(function(data) {
         updatedContent += data.description.full + '\n\n'
      });
      return updatedContent.replace(/^\s+|\s+$/g, '')
    }
  }
}

/* This example callback automatically updates Readme.md and commits the changes */
const callback = function(updatedContent, outputConfig) {
  const mdPath = outputConfig.outputPath
  const gitAdd = execSync(`git add ${mdPath}`, {}, (error) => {
    if (error) console.warn(error)
    console.log(`git add complete`)
    const msg = `${mdPath} automatically updated by markdown-steriods`
    const gitCommitCommand = `git commit -m '${msg}' --no-verify`
    execSync(gitCommitCommand, {}, (error) => {
      if (error) console.warn(error)
      console.log(`git commit automatically ran. Push up your changes!`)
    })
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownSteriods(markdownPath, config, callback)
```
<!-- AUTO-GENERATED-CONTENT:END -->

This is normal text in markdown. Keep it.