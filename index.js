const fs = require('fs-extra')
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
  const configuration = config || {}
  if (!callback && typeof configuration === 'function') {
    callback = configuration // eslint-disable-line
  } else if (typeof config === 'object' && config.callback) {
    // set callback in config for CLI usage
    callback = config.callback // eslint-disable-line
  }
  if (!files.length) {
    callback && callback('No files matched')
    console.log('No files matched pattern', filePaths)
    return false
  }
  configuration.originalFilePaths = files
  const data = []
  files.forEach((file) => {
    const output = processFile(file, configuration)
    data.push(output)
  })
  if (callback) {
    callback(null, data)
  }
}

// expose globby for use in plugins
module.exports.globby = globby

// expose fs-extra for use in plugins
module.exports.fsExtra = fs
