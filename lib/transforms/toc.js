const toc = require('markdown-toc')

function removeJunk(str, ele, arr) {
  return str.indexOf('Table of Contents') === -1;
}

module.exports = function TOC(content, options, config) {
  const tocOptions = options || {}
  /* https://github.com/jonschlinkert/markdown-toc#options */
  const opts = {
    filter: removeJunk,
    firsth1: tocOptions.firsth1 || false
  }
  const t = toc(config.outputContent, opts)
  return t.content
}
