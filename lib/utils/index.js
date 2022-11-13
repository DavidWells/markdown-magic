
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function getCodeLocation(srcPath, line, column = '0') {
  return `${srcPath}:${line}:${column}`
}

module.exports = {
  onlyUnique,
  getCodeLocation
}