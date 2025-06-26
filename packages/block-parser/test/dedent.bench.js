const { performance } = require('perf_hooks')
const { dedentInline } = require('./text.test')

function dedentInlineManual(text) {
  if (!text) return { minIndent: 0, text: '' }
  const lines = text.split('\n')
  let minIndent = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') continue
    let indent = 0
    while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) indent++
    if (minIndent === null || indent < minIndent) minIndent = indent
  }
  if (minIndent === null) return { minIndent: 0, text: text.trim() }
  
  let result = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let leading = 0
    while (leading < line.length && (line[leading] === ' ' || line[leading] === '\t')) leading++
    const toRemove = Math.min(leading, minIndent)
    result += line.slice(toRemove) + '\n'
  }
  result = result.slice(0, -1) // Remove trailing newline
  const cleanResult = result.replace(/^[\r\n]+|[\r\n]+$/g, '')
  return { minIndent, text: cleanResult }
}

function makeTestString(lines = 10000, indent = 4) {
  const pad = ' '.repeat(indent)
  let out = ''
  for (let i = 0; i < lines; i++) {
    out += pad + 'line ' + i + '\n'
  }
  return out
}

const bigString = makeTestString(10000, 6)

console.log('Benchmarking dedentInline (regex)...')
let t0 = performance.now()
for (let i = 0; i < 20; i++) dedentInline(bigString)
let t1 = performance.now()
console.log('dedentInline (regex) avg:', ((t1 - t0) / 20).toFixed(2), 'ms')

console.log('Benchmarking dedentInlineManual (manual)...')
t0 = performance.now()
for (let i = 0; i < 20; i++) dedentInlineManual(bigString)
t1 = performance.now()
console.log('dedentInlineManual (manual) avg:', ((t1 - t0) / 20).toFixed(2), 'ms')

module.exports = { dedentInlineManual } 