const globby = require('globby')
const processFile = require('./lib/processFile')

/**
 * ### API
 * ```js
 * markdownMagic(filePath, config, callback)
 * ```
 * - `filePaths` - *String or Array* - Path or glob pattern. Uses [globby patterns](https://github.com/sindresorhus/multimatch/blob/master/test.js)
 * - `config` - See configuration options below
 * - `callback` - callback to run after markdown updates
 *
 * @param  {string} filePath - Path to markdown file
 * @param  {object} [config] - configuration object
 * @param  {Function} [callback] - callback function with updated contents
 */
module.exports = function markdownMagic(filePaths, config, callback) {
  const files = globby.sync(filePaths)
  const data = []
  const configuration = config || {}
  if (!callback && typeof configuration === 'function') {
    callback = configuration // eslint-disable-line
  }
  configuration.originalFilePaths = files
  files.forEach((file) => {
    const output = processFile(file, configuration)
    data.push(output)
  })
  callback && callback(null, data)
}
