const { generateToc : generateTocUtils } = require('@davidwells/md-utils')
const { removeLeadingAndTrailingLineBreaks, escapeRegexString } = require('./regex')
const { findMinIndent } = require('./text')
const { readFile } = require('./fs')

// Alt https://github.com/thlorenz/doctoc

/**
 * @typedef {object} TocOptions
 * @property {boolean} [collapse = false] - Collapse toc in <details> pane
 * @property {string} [collapseText] - Text in expand pane
 * @property {string} [excludeText] - Text to exclude from toc
 * @property {boolean} [firsth1 = true] - Exclude first heading from toc
 * @property {boolean} [sub = false] - Mark as sub section table of contents
 * @property {number} [maxDepth = 4] - Max depth of headings to add to toc.
 */

/**
 * @typedef {object} TocAPI
 * @property {TocOptions} options - Toc generation options
 * @property {string} fileContent - Markdown contents
 * @property {string} srcPath - Path to markdown file
 * @property {function} getBlockDetails - Get block details for sub tables
 */

/**
 * Generate a table of contents
 * @param {TocAPI} api 
 * @returns 
 */
async function generateToc({
  options = {},
  fileContent,
  srcPath,
  getBlockDetails
}) {
  // const currentBlock = api.getCurrentBlock()
  // console.log('originalBlock', originalBlock)

  // process.exit(1)
  const opts = options || {}
  const isSub = opts.sub
  opts.firsth1 = (opts.firsth1) ? true : false
  let contents = fileContent
  // console.log('contents', contents)

  let collapseText = opts.collapseText

  let debugFileMatch
  // console.log('config', config.originalPath)
  // debugFileMatch = config.originalPath.match(/packages\/analytics\/README\.md/)

  // https://www.npmjs.com/package/@technote-space/toc-generator
  const tocOptions = {
    // mode: 'github.com', // github.com | bitbucket.org | gitlab.com | nodejs.org | ghost.org (default: github.com)
    isNotitle: true,
    //isCustomMode: true,
    openingComment: '',
    closingComment: '',
    maxHeaderLevel: (opts.maxDepth) ? Number(opts.maxDepth) : 4,
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
    // footer: 'end',
  }

  const tocObject = generateTocUtils(contents)

  //  let outputText = t.wrappedToc || ''
  let outputText = tocObject.text || ''

  if (debugFileMatch) {
    console.log('before firsth1 removal', outputText)
  }

  /* remove first h1 */
  if (!opts.firsth1) {
    // console.log('outputText', outputText)
    const lines = outputText.split('\n')
    let firstH1
    let firstLine
    const countOfH1s = lines.reduce((acc, line, index) => {
      if (line !== '' && !firstLine) {
        firstLine = index
      }
      if (line.match(/^-\s+/)) {
        if (!firstH1) {
          const headingText = line.match(/\[(.*)\]/)
          if (headingText) {
            const rawText = headingText[1]
            firstH1 = [line, index, firstLine === index, rawText]
          }
        }
        acc = acc + 1
      }
      return acc
    }, 0)

    const firstHeadingData =  (firstH1 && Array.isArray(firstH1)) ? firstH1 : []
    const [ lineText, lineIndex, isFirst, matchText ] = firstHeadingData
    
    let docHasHeading = false
    if (matchText) {
      // verify its h1
      const matchTextEscaped = escapeRegexString(matchText)
      // console.log('matchTextEscaped', matchTextEscaped)
      // /^#{1}\s+(.*)/
      const FIRST_H1_REGEX = new RegExp(`^#\\s*\\[?${matchTextEscaped}\\]?(?:.*)?`, 'gim')
      // /^<h1\b[^>]*>([\s\S]*?)<\/h1>/
      const FIRST_HTML_H1_REGEX = new RegExp(`^<h1\\b[^>]*>[\\s]*?(${matchTextEscaped})[\\s]*?<\\/h1>`, 'gim')
      // /^(.*)\n={3,}/
      const FIRST_UNDERSCORE_H1 = new RegExp(`^(${matchTextEscaped})\n={3,}`, 'gim')
  
      if (contents.match(FIRST_H1_REGEX)) {
        docHasHeading = matchText
      } else if (contents.match(FIRST_HTML_H1_REGEX)) {
        docHasHeading = matchText
      } else if (contents.match(FIRST_UNDERSCORE_H1)) {
        docHasHeading = matchText
      }
    }
  
    if (debugFileMatch) {
      console.log('matchText', matchText)
      if (docHasHeading) {
        console.log('Found heading 1', docHasHeading)
      }
    }

    if (debugFileMatch) {
      console.log('top level toc item count', countOfH1s)
      if (docHasHeading) {
        console.log('Found heading 1', docHasHeading)
        console.log('firstH1', firstH1)
      }
    }

    let firstItemWithContent
    let foundFirstH1

    if (docHasHeading) {
      outputText = lines.reduce((acc, line, i) => {
        const isLineEmpty = line === ''
        if (!isLineEmpty && !firstItemWithContent) {
          firstItemWithContent = i
        }
        if (!foundFirstH1 && (firstItemWithContent === i) && line.match(/^-\s+/)) {
          foundFirstH1 = true
          return acc
        }
        // Add back line and remove level
        let newLineValue = line
        if (lineText) {
          // const untilFirstH1 = i < lineIndex
          /* @TODO make option? flatten all non first h1 tags */
          if (countOfH1s > 0 && !isLineEmpty && newLineValue.match(/^\s+-/)) {
            newLineValue = line.substring(2)
          }
        }
        
        acc = acc.concat(newLineValue)
        return acc
      }, []).join('\n')
    }
 
    // console.log('outputText', outputText)
    if (debugFileMatch) {
      console.log('after firsth1 removal', outputText)
    }
  }
  // console.log(t)
  // Fix <h1> with multiple lines
  const spaces = outputText.match(/\[\n([\s\S]*?)\]/gm)
  if (spaces) {
    const fixed = spaces[0]
      // all new lines
      .replace(/\n/g, '')
      // leading spaces
      .replace(/\[\s+/, '[')
      .trim()
    outputText = outputText.replace(spaces[0], fixed)
  }
  // console.log(outputText)
  outputText = outputText
    .replace(/(.*)\[Table of Contents\]\(.*\)\n?/i, '')
    .replace(/(.*)\[toc\]\(.*\)\n?/i, '')


  if (opts.excludeText) {

    outputText = excludeTocItem(outputText, opts.excludeText)
    // // (\s+)?-(.*)\[Usage\]\(.*\)
    // const regex = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)`, 'i')
    // // /(\s+)?-(.*)\[Usage\]\(.*\)(\n\s+(.*))+/im
    // const nestedRegex = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)\(\\n\\s+\(.*\)\)+`, 'i')
    
    // const hasNested = nestedRegex.exec(outputText)
    // if (hasNested) {
    //   // Count indentation of spaces
    //   const numberOfSpaces = hasNested[1].replace(/\n/g, '').length
    //   const subItems = numberOfSpaces + 1
    //   // Update regex to only remove sub items
    //   const nestedRegexSpaces = new RegExp(`\(\\s+\)?-(.*)\\[${opts.excludeText}\\]\\(.*\\)\(\\n\\s{${subItems},}\(.*\)\)+`, 'i')
    //   // console.log('nestedRegexSpaces', nestedRegexSpaces)
    //   // If exclude value has nested sections remove them as well.
    //   outputText = outputText.replace(nestedRegexSpaces, '')
    //   outputText = outputText.replace(regex, '')
    // } else {
    //   outputText = outputText.replace(regex, '')
    // }
  }

  /* Sub table of contents */
  if (isSub) {
    // const start = fileContent.indexOf(open.value)
    // const linesBefore = fileContent.substr(0, start).split('\n')
    // const closestHeading = linesBefore.reverse().find((line) => {
    //   return line.match((/^#+/))
    // })
    const originalContents = await readFile(srcPath, { encoding: 'utf8' })
    const originalBlock = getBlockDetails(originalContents)
    const linesBefore = originalContents.substr(0, originalBlock.block.start).split('\n')
    const closestHeading = linesBefore.reverse().find((line) => {
      return line.match((/^#+/))
    })

    if (closestHeading) {
      const headingText = closestHeading.replace(/^#*\s*/, '')
      // console.log('BEFORE', linesBefore)
      // console.log('closest parent heading', closestHeading)
      // console.log('headingText', headingText)
      collapseText = collapseText || `${headingText} contents`
      // https://regex101.com/r/MB85zm/1

      const findSubToc = new RegExp(`^\(\\s+\)?-(.*)\\[${headingText}\\]\\(.*\\)(\\n\\s.*)+`, 'gm')
      // console.log('findSubToc', findSubToc)
      const single = singleLinePattern(headingText)
      // console.log('single', single)
      const subItems = outputText.match(findSubToc)
      if (subItems) {
        const items = subItems[0]
          .replace(single, '')
          .split('\n')
          .filter(Boolean)
        // console.log('items', items)
        const finalItems = items // .slice(1, items.length)
        if (finalItems) {
          const indent = findMinIndent(finalItems.join('\n'))
          // console.log('min indent', indent)
          // console.log('finalItems', finalItems)
          outputText = finalItems.map((thing) => thing.substring(indent)).join('\n')
        } else {
          // console.log('No sub items')
        }
      }
    }
  }

  // If collapse wrap in <details>
  if (opts.collapse) {
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

function singleLinePattern(text) {
  /* (\s+)?-(.*)\[Usage\]\(.*\) */
  return new RegExp(`\(\\s+\)?-(.*)\\[${text}\\]\\(.*\\)`, 'i')
}

function excludeTocItem(str, excludeText) {
  const matchTextEscaped = escapeRegexString(excludeText)
  /* (\s+)?-(.*)\[Usage\]\(.*\) */
  const regex = singleLinePattern(matchTextEscaped) // new RegExp(`\(\\s+\)?-(.*)\\[${matchTextEscaped}\\]\\(.*\\)`, 'i')
  /* /(\s+)?-(.*)\[Usage\]\(.*\)(\n\s+(.*))+/im */
  const nestedRegex = new RegExp(`\(\\s+\)?-(.*)\\[${matchTextEscaped}\\]\\(.*\\)\(\\n\\s+\(.*\)\)+`, 'i')
  
  const hasNested = nestedRegex.exec(str)
  if (hasNested) {
    // Count indentation of spaces
    const numberOfSpaces = (hasNested[1] || '').replace(/\n/g, '').length
    const subItems = numberOfSpaces + 1
    // Update regex to only remove sub items
    const nestedRegexSpaces = new RegExp(`\(\\s+\)?-(.*)\\[${matchTextEscaped}\\]\\(.*\\)\(\\n\\s{${subItems},}\(.*\)\)+`, 'i')
    // console.log('nestedRegexSpaces', nestedRegexSpaces)
    // If exclude value has nested sections remove them as well.
    str = str.replace(nestedRegexSpaces, '')
    str = str.replace(regex, '')
  } else {
    str = str.replace(regex, '')
  }
  return str
}

module.exports = {
  generateToc
}