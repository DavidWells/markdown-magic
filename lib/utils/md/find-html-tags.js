
// Might need ([\s\S]*?) instead of '*' in between tags
const HTML_TAG = /<([a-zA-Z1-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/gim

const MATCH_HTML_TAGS_REGEX = /<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/?>)/gm
// old forces closes / - /<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/>)/gm

function findHtmlTags(mdContents) {
  const parents = mdContents
    /* Fix non terminating <tags> */
    .replace(/(['"`]<(.*)>['"`])/gm, '_$2_')
    .match(MATCH_HTML_TAGS_REGEX)
  // console.log('parents', parents)

  if (parents) {
    // const children = parents.filter(Boolean).map((p) => {
    //   return p.match(HTML_TAG)
    // })
    // console.log('children', children)
  }

  const htmlTags = mdContents
    /* Fix non terminating <tags> */
    .replace(/(['"`]<(.*)>['"`])/gm, '_$2_')
    .match(MATCH_HTML_TAGS_REGEX)
  // console.log('htmlTags', htmlTags)

  let tags = []
  if (htmlTags) {
    let propsValues = {}
    // var regexSingleTag = /<([a-zA-Z1-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/
    // var regexSingleTag = /<([a-zA-Z1-6]+)([^<]+)*(?:>([\s\S]*?)<\/\1>|\s*\/>)/
    var regexSingleTag = /<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/?>)/
    for (var i = 0; i < htmlTags.length; i++) {
      // console.log('htmlTags[i]', htmlTags[i])
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
          if (propWithValue && propWithValue[1]) {
            return {
              ...acc,
              [`${propWithValue[1]}`]: (hasQuotes) ? propWithValue[2] : convert(propWithValue[2])
            }
          }
          // Check isLoading boolean props
          const booleanProp = curr.match(/([A-Za-z]*)/)
          if (booleanProp && booleanProp[1]) {
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

function convert(value) {
  if (value === 'false') {
    return false
  }
  if (value === 'true') {
    return true
  }
  const isNumber = Number(value)
  if (typeof isNumber === 'number' && !isNaN(isNumber)) {
    return isNumber
  }

  try {
    const val = JSON.parse(value)
    return val
  } catch (err) {
    
  }

  return value
}

module.exports = {
  findHtmlTags,
  MATCH_HTML_TAGS_REGEX
}