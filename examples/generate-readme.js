const fs = require('fs')
const path = require('path')
const markdownMagic = require('../index')
// const markdownMagic = require('markdown-magic')

const config = {
  matchWord: 'MD-MAGIC-EXAMPLE', // default matchWord is AUTO-GENERATED-CONTENT
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (customTransform:optionOne=hi&optionOne=DUDE) --> */
    customTransform(content, options) {
      console.log('original content in comment block', content)
      console.log('options defined on transform', options)
      // options = { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START (RENDERDOCS:path=../file.js) --> */
    RENDERDOCS(content, options) {
      const fileContents = fs.readFileSync(options.path, 'utf8')
      const docBlocs = require('doxxx').parseComments(fileContents, { raw: true, skipSingleStar: true })
      let updatedContent = ''
      docBlocs.forEach((data) => {
        updatedContent += `${data.description.full}\n\n`
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START (pluginExample) --> */
    pluginExample: require('./plugin-example')({ addNewLine: true }),
    /* Include plugins from NPM */
    // count: require('markdown-magic-wordcount'),
    // github: require('markdown-magic-github-contributors')
  }
}

const markdownPath = path.join(__dirname, '..', 'README.md')
markdownMagic(markdownPath, config, () => {
  console.log('Docs ready')
})
