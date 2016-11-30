var path = require('path')
var fs = require('fs')
var request = require('sync-request')
var isLocalPath = require('is-local-path')

const commands = {
  /**
   * **CODE** Get code from file or URL and put in markdown
   *
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated inner contents of the comment block
   */
  CODE(content, options, config) {
    let code
    let syntax = options.syntax

    if(!options.src) {
      return false
    }
    if(isLocalPath(options.src)) {
      const filePath = path.join(__dirname, options.src)
      try {
         code = fs.readFileSync(filePath, 'utf8', (err, contents) => {
           if (err) {
             console.log(`FILE NOT FOUND ${filePath}`)
             console.log(err)
             //throw err
           }
           return contents
         })
      }
      catch (e) {
        console.log(`FILE NOT FOUND ${filePath}`)
        throw e
      }
      if (!syntax) {
        syntax = path.extname(filePath).replace(/^./, '')
      }
    } else {
      // do remote request
      code = remoteRequest(options.src)
      syntax = path.extname(options.src).replace(/^./, '')
    }

    // trim leading and trailing spaces/line breaks in code
    code = code.replace(/^\s+|\s+$/g, '')

    return `\`\`\`${syntax}
${code}
\`\`\``
  },
  /**
   * **REMOTE** Get any remote Data and put in markdown
   *
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  REMOTE(content, options) {
    return remoteRequest(options.url)
  }
}

function remoteRequest(url) {
  let body
  try {
     var res = request('GET', url);
     body = res.getBody('utf8')
  }
  catch (e) {
    console.log(`URL NOT FOUND ${url}`)
    throw e
  }
  return body
}

function trimString (str) {
  return str.replace(/^\s+|\s+$/g, '')
}

module.exports = commands