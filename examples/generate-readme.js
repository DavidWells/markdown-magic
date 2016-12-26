const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const markdownMagic = require('../index') // 'markdown-magic'

const config = {
  transforms: {
    /* Match AUTO-GENERATED-CONTENT (customTransform:optionOne=hi&optionOne=DUDE) */
    customTransform(content, options) {
      console.log('original innerContent', content)
      console.log(options) // { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Match AUTO-GENERATED-CONTENT (RENDERDOCS:path=../file.js) */
    RENDERDOCS(content, options) {
      const contents = fs.readFileSync(options.path, 'utf8')
      const docBlocs = require('dox').parseComments(contents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach((data) => {
        updatedContent += `${data.description.full}\n\n`
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    /* Match AUTO-GENERATED-CONTENT (pluginExample) */
    pluginExample: require('./plugin-example')({ addNewLine: true }),
    // count: require('markdown-magic-wordcount'),
    // github: require('markdown-magic-github-contributors')
  }
}

/* This example callback automatically updates Readme.md and commits the changes */
const callback = function autoGitCommit(err, output) {
  // output is array of file information
  output.forEach(function(data) {
    const mdPath = data.outputFilePath
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
  })
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownMagic(markdownPath, config, callback)
