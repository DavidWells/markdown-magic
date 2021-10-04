const { parseJSON } = require('json-alexander')

const md = `<h1 id="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; 
 <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">
   <img src="https://www.netlify.com/img/deploy/button.svg">
 </a>
</h1>


<\!-- XYZ:START {functionName} foo={{ rad: 'blue' }} -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START [wootName] foo=['one', 'two'] -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START -->
lol
<\!-- XYZ:END -->


<\!-- XYZ:START (awesome) foo=['one', 'two'] heading=false -->
nice
<\!-- XYZ:END -->


<\!-- XYZ:START(cool) -->
nice
<\!-- XYZ:END -->


<img src="https://www.netlify.com/img/deploy/button.svg"/>


<img src="https://www.hehhehehehe.com/img/deploy/button.svg" />


<\!-- XYZ:START(cool) xxx
hhddh=cool -->
wowow
whatever we want 
<\!-- XYZ:END -->


<\!-- XYZ:START(hhh) -->
xyz
<\!-- XYZ:END -->


<\!-- XYZ:START(cool) isCool -->
nice
<\!-- XYZ:END -->


<button 
 great={[one, two, 3, 4]}
>
 wow
</button>


<button 
 width={999} 
 great={["scoot", "scoot"]} 
 nice={{ value: nice, cool: true }}
 rad="boss" 
 cool=true 
 nope=false 
 what='xnxnx' 
 isLoading 
 src="https://user-images.githubusercontent.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg"
>
 coooooll
</button>


<hr />


<br />


<ReactComponent>lolol</ReactComponent>


<ReactComponent width={123} lol={["no", "cool"]}>
 lolol
</ReactComponent>


<OtherComponent width={123} lol={["no", "cool"]} nice={{ value: "nice", cool: true }}>
 lolol
</OtherComponent>


<table style="width:100%">
 <tr>
   <th>Firstname</th>
   <th>Lastname</th>
   <th>Age</th>
 </tr>
 <tr>
   <td>Jill</td>
   <td>Smith</td>
   <td>50</td>
 </tr>
 <tr>
   <td>Eve</td>
   <td>Jackson</td>
   <td>94</td>
 </tr>
</table>


<div>
 <p>
   <img align="right" isLoading={false} width="250" src="https://user-images.githubusercontent.com/532272/123136878-46f1a300-d408-11eb-82f2-ad452498457b.jpg" />
 </p>
 <p>
  cool
 </p>
<div>


<p>
 <img align="left" width="250" src="https://user-images.githubusercontent.com/532272/123136889-4953fd00-d408-11eb-8a3e-f82f1d073298.jpg" />
</p>


 Add a little magic to your markdown 


## About


<img align="right" width="200" height="183" src="https://cloud.githubusercontent.com/assets/532272/21507867/3376e9fe-cc4a-11e6-9350-7ec4f680da36.gif" />Markdown magic uses comment blocks in markdown files to automatically sync or transform its contents.


Markdown magic uses comment blocks in markdown files to automatically sync or transform its contents. <img align="right" width="200" height="183" src="https://cloud.githubusercontent.com/assets/532272/21507867/3376e9fe-cc4a-11e6-9350-7ec4f680da36.gif" />
`
const matchWord = `XYZ`
const blockRegex = new RegExp(
  `(.*)(?:\\<\\!--(?:.*|\r?|\n?|\\s*)${matchWord}:START(?:(?:.|\\r?\\n)*?(?:\\()(.*)\\))?(.|\\r?\\n)*?)?<\!--(?:.*|\r?|\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  'gm'
)
console.log('blockRegex', blockRegex)

const newer =
  /(?:.*)(?:\<\!--(?:.*|\r?|\n?|\s*)XYZ:START\s*([(\[\{][A-Z-a-z_$-]*[)\]\}])\s*)((?:.|\r?\n)*?)<\!--(?:.*|\r?|\n?|\s*)XYZ:END(?:.|\r?\n)*?--\>/gm
console.log('newera', newer)
const newerString = new RegExp(
  `(?:.*)(?:\\<\\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:START\\s*([(\\[\\{][A-Z-a-z_$-]*[)\\]\\}])\\s*)((?:.|\\r?\\n)*?)<\!--(?:.*|\\r?|\\n?|\\s*)${matchWord}:END(?:.|\\r?\\n)*?--\\>`,
  'gm'
)
console.log('newerx', newerString)

const commentRegexInside = /<\!-*\s*([\s\S]*?) ?-*\>\n*?/g

const comments = md.match(newer)

const regexToUse = newerString
while ((array1 = regexToUse.exec(md)) !== null) {
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
      props = doWeirdParse(paramString) 
      // console.log('wierd parse', a)
    } // console.log(paramValue[0].replace(/-*>$/, ''))
  }
  console.log(`transform "${transform}" at ${regexToUse.lastIndex} using props:`)
  console.log(props)
  console.log('───────────────────────')

}

console.log('comments', comments)

if (comments) {
  console.log(comments.length)
  comments.forEach((text) => {
    const inside = commentRegexInside.exec(text)
    if (inside) {
      const config = inside[1].replace(`${matchWord}:START`, '').trim()
      console.log(formatProps(config))
    }
  })
}

// function cleanDoubleBracket(str) {
//   return str
//     .replace(/^{{/, '{')
//     .replace(/}}$/, '}')
// }

// process.exit(0)

const FIND_HTML_TAGS = /<([a-zA-Z1-6]+)\b([^>]*)>*(?:>([\s\S]*?)<\/\1>|\s?\/>)/gm

// const cleanContent = md
//     /* Fix non terminating <tags> */
//     .replace(/(['"`]<(.*)>['"`])/gm, '_$2_')

function getTags(text, debug = true) {
  const htmlTags = (text || '').match(FIND_HTML_TAGS)
  if (!htmlTags) return []

  const parsedInfo = htmlTags.reduce((acc, curr) => {
    // Reset regex https://bit.ly/2UCNhJz
    FIND_HTML_TAGS.lastIndex = 0 // Exec to find details about the tags
    const tagInfo = FIND_HTML_TAGS.exec(curr)
    if (tagInfo) {
      const [match, tag, rawProps, children] = tagInfo
      const props = formatProps(rawProps)
      if (debug) {
        // console.log('tag', tag)
        if (Object.keys(props).length) {
          console.log(`${tag} props`, props)
        }
      }
      const details = {
        tag,
        props,
        html: children || curr,
      }
      if (children) {
        details.children = getTags(children, debug)
      }
      acc = acc.concat(details)
    }
    return acc
  }, [])

  return parsedInfo
}

// const xyz = getTags(md)
// const { inspect } = require('util')
// console.log(inspect(xyz, {showHidden: false, depth: null}))

function formatProps(props) {
  if (!props) {
    return {}
  }
  const cleanProps = props // Remove new lines and tabs
    .replace(/\n\t/g, '') // Remove extra spaces
    .replace(/\s\s+/g, ' ')
    .trim()

  if (!cleanProps) {
    return {}
  }

  /* Match html attribute values */
  const MATCH_PROPS = /[A-Z-a-z]+(=(true|false|[{['"][{}\[\],/!~. "'A-Z-a-z0-9:]+['"\]\}]))?/g
  const found = cleanProps.match(MATCH_PROPS)
  // console.log('found', found)

  propsValues = found.reduce((acc, curr) => {
    const hasQuotes = curr.match(/=['"]/) // Check key="value" | key='value' |  key={value}
    const propWithValue = /([A-Za-z-_$]+)=['{"](.*)['}"]/g.exec(curr) // console.log('propWithValue', propWithValue)
    if (propWithValue) {
      // console.log(' propWithValue[2]',  propWithValue[2])
      // const isArrayLike = propWithValue[2].match(/^\[\s*"/)
      // const isObjectLike = propWithValue[2].match(/^\{\s*("|'|[A-Za-z])/)
      const isJsonLike = isJsonLikeString(propWithValue[2])
      const finValu = (!hasQuotes || isJsonLike) ? convert(propWithValue[2]) : propWithValue[2]
      return {
        ...acc,
        [`${propWithValue[1]}`]: finValu,
      }
    }

    const arrayValue = /([A-Za-z-_$]+)=(\[.*\])/g.exec(curr) // console.log('propWithValue', propWithValue)
    if (arrayValue) {
      // console.log(' propWithValue[2]',  propWithValue[2])
      // const isArrayLike = propWithValue[2].match(/^\[\s*"/)
      // const isObjectLike = propWithValue[2].match(/^\{\s*("|'|[A-Za-z])/)
      const isJsonLike = isJsonLikeString(arrayValue[2])
      const finValu =
        !hasQuotes || isJsonLike ? convert(arrayValue[2]) : arrayValue[2]
      return {
        ...acc,
        [`${arrayValue[1]}`]: finValu,
      }
    } // Check isLoading boolean props

    const booleanProp = curr.match(/([A-Za-z-_$]*)/)
    if (booleanProp) {
      return {
        ...acc,
        [`${booleanProp[1]}`]: true,
      }
    }
    return acc
  }, {})

  return propsValues
}

function isJsonLikeString(str = '') {
  return str.match(/^\{|^\[/)
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

  // console.log(typeof value)
  // console.log('value', value)
  try {
    const val = parseJSON(value) // last attempt to format an array like [ one, two ]
    if (typeof val === 'string' && val.match(/^\[/) && val.match(/\]$/)) {
      const inner = val.match(/^\[(.*)\]/)
      if (inner && inner[1]) {
        const newVal = inner[1].split(', ').map((x) => {
          return convert(x.trim())
        })
        return newVal
      }
    }
    return val
  } catch (err) {
    console.log('val', value)
    console.log('err', err)
  }

  return value
}

// x = `nice={{ value: nice, cool: "true" }}
//   soclose=[jdjdjd, hdhfhfhffh]`

function doWeirdParse(x) {
  // https://regex101.com/r/bx8DXm/1/ Match everything but spaces/newlines
  var y = /("|'|{)[^"}]+("|'|})|(\S+)/g

  const cleanLines = x
    .split(/\n/)
    .filter((line) => {
      // Trim all comment blocks
      return !line.trim().match(/^(\/\/+|\/\*+|#+)/gm)
    })
    .join('\n')

  var lines = cleanLines.match(y)
  console.log('lines', lines.length)
  // console.log('lines', lines)
  var isEnding = /(['"}\]]|true,?|false,?)$/

  const values = lines.reduce((acc, curr, i) => {
    const isLastLoop = lines.length === (i + 1)
    const nextItem = lines[i + 1] || '' 
    const hasText = curr.match(/^[A-Za-z]/)
    let alreadyAdded = false

    //*
    console.log('isLastLoop', isLastLoop)
    console.log('__private', acc['__private']) 
    console.log("current item", curr) 
    console.log('next item   ', nextItem) 
    /** */

    // If has no = its a true boolean. e.g isThingy
    if (hasText && acc['__private'].match(/^[A-Za-z]/) && !isValuePair(acc['__private'])) {
      // console.log('xxxxxxx', acc['__private'])
      acc[trimTrailingComma(acc['__private'])] = true
      acc['__private'] = ''
    } 
    // If has no = its a true boolean
    if (hasText && !curr.match(isEnding) && acc['__private'].match(isEnding)) {
      // console.log('end', curr)
      const kv = getKeyAndValueFromString(acc['__private'])
      if (kv) {
        acc[kv.key] = kv.value
      }
      acc['__private'] = ''
    }

    if (!acc['__private'].match(/^[A-Za-z]+={+/) && isValuePair(curr) && curr.match(isEnding)) {
      const kv = getKeyAndValueFromString(curr)
      if (kv) {
        // console.log(`ADDED`, kv)
        acc[kv.key] = kv.value
      }
    } else {
      // console.log('Add', curr)
      alreadyAdded = true
      acc['__private'] = acc['__private'] + curr
    }


    if (acc['__private'].match(isEnding) && nextItem.match(/^[A-Za-z0-9_-]/)) {
      const kv = getKeyAndValueFromString(acc['__private'])
      if (kv) {
        // console.log(`acc['__private'].match(isEnding)`, kv)
        acc[kv.key] = kv.value
      }
      acc['__private'] = ''
    }

    // If ends in number foo=2 or bar=3,
    if (isValuePair(curr) && curr.match(/\d,?$/)) {
      const kv = getKeyAndValueFromString(acc['__private'])
      if (kv) {
        // console.log(`acc['__private'].match(isEnding)`, kv)
        acc[kv.key] = kv.value
      }
      acc['__private'] = ''
    }

    // If last loop and still no match and looks like KV. Parse it
    if (isLastLoop) {
      // If single isCool boolean
      if (hasText && !curr.match(/=/)) {
        // console.log(`ADDED`, kv)
        // acc[curr] = true
        // acc['__private'] = ''
      }
      console.log('currrrrr', curr)
      console.log("acc['__private']", acc['__private'])
      console.log('combined', acc['__private'] + curr)
      // If value empty but __private have accumulated values
      if (acc['__private']) {
      // if (acc['__private'] && (acc['__private'].match(isEnding) || isValuePair(acc['__private']))) {
        const valueToCheck = (curr.match(isEnding) && !alreadyAdded) ? acc['__private'] + curr : acc['__private']
        console.log('valueToCheck', valueToCheck)
        const kv = getKeyAndValueFromString(valueToCheck)
        if (kv) {
          // console.log(`acc['__private'].match(isEnding)`, kv)
          acc[kv.key] = kv.value
        }
        acc['__private'] = ''
      }
    }

    return acc
  }, {
    __private: '',
  })

  delete values.__private

  /* // If no keys last attempt to parse
  if (!Object.keys(values).length) {
    const kv = getKeyAndValueFromString(x)
    if (kv) {
      return {  
        [`${kv.key}`]: kv.value
      }
    }
  }
  */

  return values
}

function isValuePair(str) {
  return str.match(/=/)
}

function getKeyAndValueFromString(string) {
  if (!string) return
  // const keyValueRegex = /([A-Za-z-_$]+)=['{"]?(.*)['}"]?/g
  // const match = keyValueRegex.exec(string)
  // if (!match) {
  //   return
  // }
  // console.log('getKeyAndValueFromString')

  const [key, ...values] = string.split('=')
  if (!key) {
    return
  }
  console.log('string', string)
  console.log('key', key)
  console.log('values', values)
  /* If no value, isThing === true */
  if (!values.length) {
    return {
      key: key,
      value: true,
    }
  }

  const value = values.join('')

  let cleanValue = value
    .replace(/^{{2,}/, '{')
    .replace(/}{2,}$/, '}')
    .replace(/^\[{2,}/, '[')
    .replace(/\]{2,}$/, ']')
    // Trim trailing commas
    .replace(/,$/, '')

  if (value.match(/^{[^:,]*}/)) {
    cleanValue = removeSurroundingBrackets(cleanValue)
  } else if (value.match(/^{\s*\[\s*[^:]*\s*\]\s*\}/)) {
    // Match { [ one, two ,3,4 ]   }
    cleanValue = removeSurroundingBrackets(cleanValue)
  } 

  return {
    key: key,
    value: convert(cleanValue),
  }
}

function trimTrailingComma(str = '') {
  // Trim trailing commas
  return str.replace(/,$/, '')
}

function removeSurroundingBrackets(val) {
  return val.replace(/^{/, '').replace(/}$/, '')
}

module.exports = doWeirdParse