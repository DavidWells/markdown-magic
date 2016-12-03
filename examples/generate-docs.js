const fs = require('fs')
const path = require('path')
const dox = require('dox')
const execSync = require('child_process').execSync
// require('markdown-steriods') lib
const markdownMagic = require('../index')

const config = {
  commands: {
    /* Update the content in comment in .md matching
       AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE)
    */
    customTransform(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Update the content in comment in .md matching
      AUTO-GENERATED-CONTENT (RENDERDOCS:path=../file.js)
    */
    RENDERDOCS(content, options) {
      const filePath = path.join(__dirname, options.path)
      const contents = fs.readFileSync(filePath, 'utf8')
      const docBlocs = dox.parseComments(contents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach((data) => {
        updatedContent += `${data.description.full}\n\n`
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    pluginExample: require('./plugin-example')({ addNewLine: true })
  }
}

/* This example callback automatically updates Readme.md and commits the changes */
const callback = function autoGitCommit(updatedContent, outputConfig) {
  const mdPath = outputConfig.outputPath
  const gitAdd = execSync(`git add ${mdPath}`, {}, (error) => {
    if (error) console.warn(error)
    console.log('git add complete')
    const msg = `${mdPath} automatically updated by markdown-magic`
    const gitCommitCommand = `git commit -m '${msg}' --no-verify`
    execSync(gitCommitCommand, {}, (err) => {
      if (err) console.warn(err)
      console.log('git commit automatically ran. Push up your changes!')
    })
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownMagic(markdownPath, config, callback)
