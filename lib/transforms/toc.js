"use strict" // eslint-disable-line
// const toc = require('markdown-toc')
const { transform} = require('@technote-space/doctoc')
const { removeLeadingAndTrailingLineBreaks } = require('../utils/regex')

function makeToc(md) {
  return new Promise((resolve, reject) => {
    remark()
      .use(toc)
      .process(md, function(err, tableOfContents) {
        if (err) {
          return reject(err)
        }
        return resolve(tableOfContents)
      })
  })
}

module.exports = async function TOC(content, options, config) {
  const opts = options || {}

  let contents = config.outputContent
  // console.log('contents', contents)

  if (opts.firsth1) {
    
  } else {
    // Remove first h1
    const FIRST_H1_REGEX = /^#{1}\s+(.*)/
    // Remove first <h1>
    const FIRST_HTML_H1_REGEX = /^<h1\b[^>]*>([\s\S]*?)<\/h1>/
    // Remove first h1 with triple underscores
    const FIRST_UNDERSCORE_H1 = /^(.*)\n={3,}/
    if (contents.match(FIRST_H1_REGEX)) {
      contents = contents.replace(FIRST_H1_REGEX, '')
    } else if (contents.match(FIRST_HTML_H1_REGEX)) {
      contents = contents.replace(FIRST_HTML_H1_REGEX, '')
    } else if (contents.match(FIRST_UNDERSCORE_H1)) {
      contents = contents.replace(FIRST_UNDERSCORE_H1, '')
    }
  }
  // console.log('contents', contents)

  // https://www.npmjs.com/package/@technote-space/toc-generator
  const t = await transform(contents, {
    // mode: 'github.com', // github.com | bitbucket.org | gitlab.com | nodejs.org | ghost.org (default: github.com)
    isNotitle: true,
    //isCustomMode: true,
    openingComment: '',
    closingComment: '', 
    maxHeaderLevel: (opts.maxDepth) ? Number(opts.maxDepth) : 4
    // maxHeaderLevel: 2, // default: 4
    // title: '**Table of Contents**',
    // isNotitle: true,
    // isFolding: true,
    // entryPrefix: '*',
    // processAll: true,
    // updateOnly: true,
    // openingComment: '<!-- toc -->',
    // closingComment: '<!-- tocstop --> ',
    // checkOpeningComments: ['<!-- toc '],
    // checkClosingComments: ['<!-- tocstop '],
    // isCustomMode: false,
    // customTemplate: '<p align="center">${ITEMS}</p>',
    // itemTemplate: '<a href="${LINK}">${TEXT}</a>',
    // separator: '<span>|</span>',
    // footer: '',
  })
  let output = t.wrappedToc || ''
  // console.log(t)
  // Fix <h1> with multiple lines
  const spaces = output.match(/\[\n([\s\S]*?)\]/gm)
  if (spaces) {
    const fixed = spaces[0]
      // all new lines
      .replace(/\n/g, '')
      // leading spaces
      .replace(/\[\s+/, '[')
      .trim()
    output = output.replace(spaces[0], fixed)
  }
  // console.log(output)
  output = output
    .replace(/(.*)\[Table of Contents\]\(.*\)\n?/i, '')
    .replace(/(.*)\[toc\]\(.*\)\n?/i, '')


  if (opts.excludeText) {
    // (\s+)?-(.*)\[Usage\]\(.*\)
    const regex = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)`, 'i')
    // /(\s+)?-(.*)\[Usage\]\(.*\)(\n\s+(.*))+/im
    const nestedRegex = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)\(\\n\\s+\(.*\)\)+`, 'i')
    
    const hasNested = nestedRegex.exec(output)
    if (hasNested) {
      // Count indentation of spaces
      const numberOfSpaces = hasNested[1].replace(/\n/g, '').length
      const subItems = numberOfSpaces + 1
      // Update regex to only remove sub items
      const nestedRegexSpaces = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)\(\\n\\s{${subItems},}\(.*\)\)+`, 'i')
      // console.log('nestedRegexSpaces', nestedRegexSpaces)
      // If exclude value has nested sections remove them as well.
      output = output.replace(nestedRegexSpaces, '')
      output = output.replace(regex, '')
    } else {
      output = output.replace(regex, '')
    }
  }

  // If collapse wrap in <details>
  if (opts.collapse) {
    const text = (opts.collapseText) ? opts.collapseText : 'Table of Contents'
    return `<details>
<summary>${text}</summary>
${output   
  // Replace leading double spaces
  .replace(/^\n\n/, '\n')
  // Replace trailing double spaces
  .replace(/\n\n$/, '\n')}
</details>`
  }

  return output.replace(removeLeadingAndTrailingLineBreaks, '')
}

const HTML_TAG = /<([a-zA-Z1-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/gim

function parseHtmlProps(mdContents) {
  const htmlTags = mdContents
    /* Fix non terminating <tags> */
    .replace(/(['"`]<(.*)>['"`])/gm, '_$2_')
    .match(HTML_TAG)
  //console.log('htmlTags', htmlTags)

  let tags = []
  if (htmlTags) {
    let propsValues = {}
    var regexSingleTag = /<([a-zA-Z1-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/
    for (var i = 0; i < htmlTags.length; i++) {
      var tagMatches = regexSingleTag.exec(htmlTags[i])
      // console.log('tagMatches', tagMatches)
      var [ match, tag, props ] = tagMatches
      // console.log(`Tag #${i} ${tag}`)
      if (props) {
        const cleanProps = props
          // Remove new lines and tabs
          .replace(/\n\t/g, '')
          // Remove extra spaces
          .replace(/\s\s+/g, ' ')
          .trim()

        propsValues = cleanProps.split(" ").reduce((acc, curr) => {
          const hasQuotes = curr.match(/=['"]/)
          // Check key="value" | key='value' |  key={value}
          const propWithValue = /([A-Za-z-_$]+)=['{"](.*)['}"]/g.exec(curr)
          if (propWithValue) {
            return {
              ...acc,
              [`${propWithValue[1]}`]: (hasQuotes) ? propWithValue[2] : convert(propWithValue[2])
            }
          }
          // Check isLoading boolean props
          const booleanProp = curr.match(/([A-Za-z]*)/)
          if (booleanProp) {
            return {
              ...acc,
              [`${booleanProp[1]}`]: true
            }
          }
          return acc
        }, {})
      }

      tags.push({
        tag: tag,
        props: propsValues,
        raw: match
      })
    }
  }
  return tags
}

function removeUndefined(output) {
  // remove undefined from new line and start of string if first H1 is missing
  return output.replace(/\nundefined/g, '\n-').replace(/^undefined/g, '-')
}
