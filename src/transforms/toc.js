const { generateToc } = require('@davidwells/md-utils')
const { removeLeadingAndTrailingLineBreaks, escapeRegexString } = require('../utils/regex')
const sectionToc = require('./sectionToc')
/**
 * Options for configuring the table of contents.
 * @typedef {Object} ToCTransformOptions
 * @property {boolean} [firsth1=false] - Show the first h1 of the document in the table of contents. Default is `false`.
 * @property {boolean} [collapse=false] - Collapse the table of contents in a detail accordion. Default is `false`.
 * @property {string} [collapseText] - Text for the summary of the table of contents accordion.
 * @property {string} [excludeText="Table of Contents"] - Text to exclude in the table of contents. Default is `Table of Contents`.
 * @property {number} [maxDepth=4] - Maximum depth of headings to include in the table of contents. Default is `4`.
 * @example
   ```md
   <!-- doc-gen (TOC) -->
   toc will be generated here
   <!-- end-doc-gen -->
   ``` 
 */

module.exports = async function TOC(api) {
  // console.log("TOC API", api)
  const { currentFileContent, srcPath, getBlockDetails } = api
  /** @type {ToCTransformOptions} */
  const options = api.options || {}
  // console.log("TOC OPTIONS", options)

  // process.exit(1)
  const opts = options || {}
  const includeToc = opts.includeToc || false
  const isSub = opts.sub

  if (isSub) {
    return sectionToc(api)
  }

  opts.firsth1 = (opts.firsth1 || opts.firstH1) ? true : false
  let contents = currentFileContent
  // console.log('contents', contents)

  let collapseText = opts.collapseText

  let debugFileMatch
  // console.log('config', config.originalPath)
  // debugFileMatch = config.originalPath.match(/packages\/analytics\/README\.md/)

  // https://www.npmjs.com/package/@technote-space/toc-generator
  const tocOptions = {
    // mode: 'github.com', // github.com | bitbucket.org | gitlab.com | nodejs.org | ghost.org (default: github.com)
    //isCustomMode: true,
    openingComment: '',
    closingComment: '',
    maxDepth: (opts.maxDepth) ? Number(opts.maxDepth) : 4,
    normalizeLevels: true,
    trimLeadingHeading: true,
    // maxHeaderLevel: 2, // default: 4
    // title: '**Table of Contents**',
    // isNoTitle: true,
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
    // footer: 'end',
  }

  /* Exclude Table of contents section from toc */
  if (!includeToc) {
    tocOptions.filter = (item) => {
      const text = item.text.trim().toLowerCase()
      return text !== 'table of contents' && text !== 'toc'
    }
  }

  const tocObject = generateToc(contents, tocOptions)
  // console.log("TOC OPTIONS", contents)
  // console.log("TOC OBJECT", tocObject)
  // process.exit(1)
  //  let outputText = t.wrappedToc || ''
  let outputText = tocObject.text || ''

  // console.log('outputText')
  // console.log(outputText)
  //process.exit(1)

    // If collapse wrap in <details>
  if (opts.collapse || opts.collapseText) {
    return `<details>
<summary>${collapseText || 'Table of Contents'}</summary>

${outputText   
  // Replace leading double spaces
  .replace(/^\n*/g, '')
  // Replace trailing double spaces
  .replace(/\n*$/g, '')
}

</details>`
  }
  return outputText.replace(removeLeadingAndTrailingLineBreaks, '')
}