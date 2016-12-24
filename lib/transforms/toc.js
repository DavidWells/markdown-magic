const toc = require('markdown-toc')

module.exports = function TOC(content, options, config) {
  const t = toc(config.outputContent).content
  return t
}
