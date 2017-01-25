"use strict" // eslint-disable-line

module.exports = function sortPluginOrder(transformsRegistered, transformsFound) {
  const order = []
  let transformsToRun = transformsFound

  const defaultOrder = transformsRegistered.sort((a, b) => {
    // put table of contents (TOC) at end of tranforms
    if (a !== 'TOC') return -1
    if (b !== 'TOC') return 1
    return 0
  })

  defaultOrder.forEach((key) => {
    transformsToRun = transformsToRun.filter((data) => {
      const command = data.transform.split(':')
      if (command[0] === key) {
        order.push(data)
        return false
      }
      return true
    })
  })

  return order
}
