/* Custom Transform Plugin example */
module.exports = function customPlugin(pluginOptions) {
  // set plugin defaults
  const defaultOptions = {
    addNewLine: false
  }
  const userOptions = pluginOptions || {}
  const pluginConfig = Object.assign(defaultOptions, userOptions)
  // return the transform function
  return function myCustomTransform ({ content, options }) {
    const newLine = (pluginConfig.addNewLine) ? '\n' : ''
    const updatedContent = content + newLine
    return updatedContent
  }
}
