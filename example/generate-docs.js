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


const callback = function(updatedContent, outputConfig) {
  console.log('Docs have been updated. Commit them!')
  const markdowPath = outputConfig.originalPath
  const gitAdd = execSync(`git add ${markdowPath}`, {}, (error) => {
    if (error) console.warn(error)
    console.log(`git add complete`)
    const msg = `${markdowPath} automatically updated by markdown-steriods`
    const gitCommitCommand = `git commit -m '${msg}' --no-verify`
    execSync(gitCommitCommand, {}, (error) => {
      if (error) console.warn(error)
      console.log(`git commit automatically ran. Push up your changes!`)
    })
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownSteriods(markdownPath, config, callback)
