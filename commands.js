var path = require('path')
var fs = require('fs')
var request = require('sync-request')
var isLocalPath = require('is-local-path')

const commands = {
  /**
   * ### `CODE`
   *
   * Get code from file or URL and put in markdown
   *
   * **Options**
   * - `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
   * - `syntax` (optional): Syntax will be inferred by fileType if not specified
   *
   * **Example:**
   * ```md
   * <-- MATCHWORD:START (CODE:src=./relative/path/to/code.js) -->
   * This content will be dynamically replaced with code from the file
   * <-- MATCHWORD:END -->
   * ```
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
      const fileDir = path.dirname(config.originalPath)
      const filePath = path.join(fileDir, options.src)
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
   * ### `REMOTE`
   *
   * Get any remote Data and put in markdown
   *
   * **Options**
   * - `url`: The URL of the remote content to pull in
   *
   * **Example:**
   * ```md
   * <-- MATCHWORD:START (REMOTE:url=http://url-to-raw-md.md) -->
   * This content will be dynamically replace from the remote url
   * <-- MATCHWORD:END -->
   * ```
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