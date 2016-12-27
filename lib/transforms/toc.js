const toc = require('markdown-toc')

function removeJunk(str, ele, arr) {
  return str.indexOf('Table of Contents') === -1;
}

module.exports = function TOC(content, options, config) {
  const opts = options || {}
  /* https://github.com/jonschlinkert/markdown-toc#options */
  const tocOpts = {
    filter: removeJunk,
    firsth1: opts.firsth1 || false
  }
  const t = toc(config.outputContent, tocOpts)
  let output = t.content
  if (opts.collapse) {
    const text = (opts.collapseText) ? opts.collapseText : 'Table of Contents'
    output = `<details>
<summary>${text}</summary>
${output}
</details>`
  }
  return output
}
