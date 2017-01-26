'use strict'; // eslint-disable-line

const toc = require('markdown-toc')

module.exports = function TOC(content, options, config) {
  const opts = options || {}
  /* https://github.com/jonschlinkert/markdown-toc#options */
  const tocOpts = {
    filter: function removeJunk(str, ele, arr) {
      return str.indexOf((opts.excludeText) ? opts.excludeText : 'Table of Contents') === -1
    },
    firsth1: opts.firsth1 || false
  }
  const t = toc(config.outputContent, tocOpts)
  let output = t.content
  // fix `undefined` bug from 'markdown-toc'
  output = output.replace(/\nundefined/g, '\n-')
  if (opts.collapse) {
    const text = (opts.collapseText) ? opts.collapseText : 'Table of Contents'
    output = `<details>
<summary>${text}</summary>
${output}
</details>`
  }
  return output
}
