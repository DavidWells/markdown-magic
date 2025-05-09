const path = require('path')
const { readFileSync } = require('fs')
const { parseComments } = require('doxxx')
const { markdownMagic } = require('../src')
const { deepLog } = require('../src/utils/logs')

const config = {
  matchWord: 'MD-MAGIC-EXAMPLE', // default matchWord is AUTO-GENERATED-CONTENT
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (customTransform:optionOne=hi&optionOne=DUDE) --> */
    customTransform({ content, options }) {
      console.log('original content in comment block', content)
      console.log('options defined on transform', options)
      // options = { optionOne: hi, optionOne: DUDE}
      return `This will replace all the contents of inside the comment ${options.optionOne}`
    },
    /* Match <!-- AUTO-GENERATED-CONTENT:START JSDocs path="../file.js" --> */
    JSDocs(markdownMagicPluginAPI) {
      const { options } = markdownMagicPluginAPI
      const fileContents = readFileSync(options.path, 'utf8')
      const docBlocs = parseComments(fileContents, { skipSingleStar: true })
        .filter((item) => {
          return !item.isIgnored
        })
        /* Remove empty comments with no tags */
        .filter((item) => {
          return item.tags.length
        })
        /* Remove inline type defs */
        .filter((item) => {
          return item.description.text !== ''
        })
        /* Sort types to end */
        .sort((a, b) => {
          if (a.type && !b.type) return 1
          if (!a.type && b.type) return -1
          return 0
        })

      docBlocs.forEach((data) => {
        // console.log('data', data)
        delete data.code
      })
      // console.log('docBlocs', docBlocs)

      if (docBlocs.length === 0) {
        throw new Error('No docBlocs found')
      }

      // console.log(docBlocs.length)
      let updatedContent = ''
      docBlocs.forEach((data) => {
        if (data.type) {
          updatedContent += `#### \`${data.type}\`\n\n`
        }

        updatedContent += `${data.description.text}\n`

        if (data.tags.length) {
         let table =  '| Name | Type | Description |\n'
          table += '|:---------------------------|:---------------:|:-----------|\n'
          data.tags.filter((tag) => {
            if (tag.tagType === 'param') return true
            if (tag.tagType === 'property') return true
            return false
          }).forEach((tag) => {
            const optionalText = tag.isOptional ? ' (optional) ' : ' '
            const defaultValueText = (typeof tag.defaultValue !== 'undefined') ? ` Default: \`${tag.defaultValue}\` ` : ' '
            table += `| \`${tag.name}\`${optionalText}`
            table += `| \`${tag.type.replace('|', 'or')}\` `
            table += `| ${tag.description.replace(/\.\s?$/, '')}.${defaultValueText}|\n`
          })
          updatedContent+= `\n${table}\n`

          const returnValues = data.tags.filter((tag) => tag.tagType === 'returns')
          if (returnValues.length) {
            returnValues.forEach((returnValue) => {
              updatedContent += `**Returns**\n\n`
              updatedContent += `\`${returnValue.type}\`\n\n`
            })
          }

          const examples = data.tags.filter((tag) => tag.tagType === 'example')
          if (examples.length) {
            examples.forEach((example) => {
              updatedContent += `**Example**\n\n`
              updatedContent += `\`\`\`js\n${example.tagValue}\n\`\`\`\n\n`
            })
          }
        }
      })
      return updatedContent.replace(/^\s+|\s+$/g, '')
    },
    INLINE_EXAMPLE: () => {
      return '**⊂◉‿◉つ**'
    },
    lolz() {
      return `This section was generated by the cli config markdown.config.js file`
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
