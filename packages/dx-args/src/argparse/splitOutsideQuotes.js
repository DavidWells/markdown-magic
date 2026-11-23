
function splitOutsideQuotes(str) {

  let parts = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''
  let braceCount = 0
  let bracketCount = 0

  for (let char of str) {
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true
      quoteChar = char
      current += char
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false
      quoteChar = ''
      current += char
    } else if (char === '{' && !inQuotes) {
      braceCount++
      current += char
    } else if (char === '}' && !inQuotes) {
      braceCount--
      current += char
    } else if (char === '[' && !inQuotes) {
      bracketCount++
      current += char
    } else if (char === ']' && !inQuotes) {
      bracketCount--
      current += char
    } else if (char === ' ' && !inQuotes && !braceCount && !bracketCount) {
      if (current) parts.push(current)
      current = ''
    } else {
      current += char
    }
  }

  if (current) parts.push(current)
  return parts
  /* combineEquals */
  .reduce((acc, item, i) => {
    if (item.startsWith('=')) {
      acc[acc.length - 1] += item
      return acc
    }

    if (acc.length && acc[acc.length - 1].endsWith('=') && (acc[acc.length - 1].match(/=/g) || []).length === 1) {
      acc[acc.length - 1] += item
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

module.exports = {
  splitOutsideQuotes
}
