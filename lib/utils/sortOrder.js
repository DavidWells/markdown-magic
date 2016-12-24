
module.exports = function sortPluginOrder(transformsRegistered, transformsFound) {
  const result = []
  let transformsToRun = transformsFound

  const defaultOrder = transformsRegistered.sort((a, b) => {
    // put table of contents (TOC) at end of tranforms
    if (a !== 'TOC') return -1
    if (b !== 'TOC') return 1
    return 0
  })

  defaultOrder.forEach((key) => {
    let found = false
    transformsToRun = transformsToRun.filter((data) => {
      const command = data.transform.split(':')
      if (!found && command[0] === key) {
        result.push(data)
        found = true
        return false
      }
      return true
    })
  })

  return result
}
