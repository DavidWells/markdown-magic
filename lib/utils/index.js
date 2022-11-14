
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function getCodeLocation(srcPath, line, column = '0') {
  return `${srcPath}:${line}:${column}`
}

function pluralize(thing, single = '', plural = '') {
  const count = Array.isArray(thing) ? thing.length : Number(thing)
  return count === 1 ? single : plural
}

module.exports = {
  pluralize,
  onlyUnique,
  getCodeLocation
}