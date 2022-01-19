const { transform } = require('@technote-space/doctoc')
const { removeLeadingAndTrailingLineBreaks } = require('../utils/regex')

module.exports = async function TOC(content, options, config) {
  const opts = options || {}
  opts.firsth1 = (opts.firsth1) ? true : false
  let contents = config.outputContent
  // console.log('contents', contents)

  let debugFileMatch
  // console.log('config', config.originalPath)
  // debugFileMatch = config.originalPath.match(/packages\/analytics\/README\.md/)

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

  if (debugFileMatch) {
    console.log('before firsth1 removal', output)
  }

  /* remove first h1 */
  if (!opts.firsth1) {
    // console.log('output', output)
    const lines = output.split('\n')
    let firstH1
    let firstLine
    const countOfH1s = lines.reduce((acc, line, index) => {
      if (line !== '' && !firstLine) {
        firstLine = index
      }
      if (line.match(/^-\s+/)) {
        if (!firstH1) {
          const rawText = line.match(/\[(.*)\]/)[1]
          firstH1 = [line, index, firstLine === index, rawText]
        }
        acc = acc + 1
      }
      return acc
    }, 0)

    const firstHeadingData =  (firstH1 && Array.isArray(firstH1)) ? firstH1 : []
    const [ lineText, lineIndex, isFirst, matchText ] = firstHeadingData
    
    // verify its h1
    const matchTextEscaped = escapeStringRegexp(matchText)
    // console.log('matchTextEscaped', matchTextEscaped)
    // /^#{1}\s+(.*)/
    const FIRST_H1_REGEX = new RegExp(`^#\\s*\\[?${matchTextEscaped}\\]?(?:.*)?`, 'gim')
    // /^<h1\b[^>]*>([\s\S]*?)<\/h1>/
    const FIRST_HTML_H1_REGEX = new RegExp(`^<h1\\b[^>]*>[\\s]*?(${matchTextEscaped})[\\s]*?<\\/h1>`, 'gim')
    // /^(.*)\n={3,}/
    const FIRST_UNDERSCORE_H1 = new RegExp(`^(${matchTextEscaped})\n={3,}`, 'gim')
    
    let docHasHeading = false
    if (contents.match(FIRST_H1_REGEX)) {
      docHasHeading = matchText
    } else if (contents.match(FIRST_HTML_H1_REGEX)) {
      docHasHeading = matchText
    } else if (contents.match(FIRST_UNDERSCORE_H1)) {
      docHasHeading = matchText
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
      output = lines.reduce((acc, line, i) => {
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
 
    // console.log('output', output)
    if (debugFileMatch) {
      console.log('after firsth1 removal', output)
    }
  }
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

function escapeStringRegexp(string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return string
		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
		.replace(/-/g, '\\x2d');
}

function removeUndefined(output) {
  // remove undefined from new line and start of string if first H1 is missing
  return output.replace(/\nundefined/g, '\n-').replace(/^undefined/g, '-')
}

// Alt https://github.com/thlorenz/doctoc
