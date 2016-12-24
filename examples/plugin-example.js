/* Custom Transform Plugin example */
const merge = require('deepmerge')
module.exports = function customPlugin(pluginOptions) {
  // set plugin defaults
  const defaultOptions = {
    addNewLine: false
  }
  const userOptions = pluginOptions || {}
  const pluginConfig = merge(defaultOptions, userOptions)
  // return the transform function
  return function myCustomTransform (content, options) {
    const newLine = (pluginConfig.addNewLine) ? '\n' : ''
    const updatedContent = content + newLine
    return updatedContent
  }
}
