
const weirdParse = require('./weird-parse')

function newParser(content) {
  const matchWord = `XYZ`
  const transforms = []
  // const blockRegex = new RegExp(
  //   `(.*)(?:\\<\\!--(?:.*|\r?|\n?|\\s*)${matchWord}:START(?:(?:.|\\r?\\n)*?(?:\\()(.*)\\))?(.|\\r?\\n)*?)?<\!--(?:.*|\r?|\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  //   'gm'
  // )
  // console.log('blockRegex', blockRegex)

  const newer =
    /(?:.*)(?:\<\!--(?:.*|\r?|\n?|\s*)XYZ:START\s*([(\[\{][A-Z-a-z_$-]*[)\]\}])\s*)((?:.|\r?\n)*?)<\!--(?:.*|\r?|\n?|\s*)XYZ:END(?:.|\r?\n)*?--\>/gmi
  console.log('newera', newer)
  const newerString = new RegExp(
    `(?:.*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{][A-Z-a-z_$-]*[)\\]\\}])\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
    'gmi'
  )
  console.log('newerx', newerString)

  const commentRegexInside = /<\!-*\s*([\s\S]*?) ?-*\>\n*?/g

  const comments = content.match(newer)
  
  const regexToUse = newerString
  while ((array1 = regexToUse.exec(content)) !== null) {
    let props = {}
    const [match, action, params] = array1
    const transform = action.replace(/[(\[\{](.*)[)\]\}]/, '$1')
    // console.log('params', params)
    const paramValue = params.match(/([\s\S]*?)-->/gm)
    if (paramValue) {
      const paramString = paramValue[0].replace(/-*>$/, '').trim()
      console.log('paramString', paramString)
      if (paramString) {
        // props = formatProps(paramString)
        props = weirdParse(paramString) 
        // console.log('wierd parse', a)
      } // console.log(paramValue[0].replace(/-*>$/, ''))
    }
    console.log(`transform "${transform}" at ${regexToUse.lastIndex} using props:`)
    console.log(props)
    console.log('───────────────────────')
    transforms.push({
      transform,
      args: props,
      location: regexToUse.lastIndex
    })
  }

  console.log('comments', comments)

  if (comments) {
    console.log(comments.length)
    comments.forEach((text) => {
      const inside = commentRegexInside.exec(text)
      if (inside) {
        const config = inside[1].replace(`${matchWord}:START`, '').trim()
        // console.log(formatProps(config))
      }
    })
  }

  return transforms
}

module.exports = newParser