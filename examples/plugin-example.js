/**
 * Custom Transform Plugin example
 */
module.exports = function customPlugin(pluginOptions) {
  const defaultOptions = {
    addNewLine: false
  }
  const userOptions = pluginOptions || {}
  const pluginConfig = mergeOptions(defaultOptions, userOptions)
  console.log('pluginConfig', pluginConfig)
  return function (content, options) {
    // console.log('content', content)
    // console.log(arguments)
    const newLine = (pluginConfig.addNewLine) ? '\n' : ''
    const updatedContent = content + newLine
    console.log('return', updatedContent)
    return updatedContent
  }
}

/**
 * Overwrites pluginDefaults's values with userDefinedOptions's and adds userDefinedOptions's if non existent in pluginDefaults
 * @param pluginDefaults
 * @param userDefinedOptions
 * @returns obj3 a new object based on pluginDefaults and userDefinedOptions
 */
function mergeOptions(pluginDefaults, userDefinedOptions) {
  const obj3 = {}
  for (var attrname in pluginDefaults) {
    obj3[attrname] = pluginDefaults[attrname]
  }
  for (var attrname in userDefinedOptions) {
    obj3[attrname] = userDefinedOptions[attrname]
  }
  return obj3
}
