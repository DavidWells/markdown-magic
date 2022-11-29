// Fork of https://github.com/andrejewski/himalaya with tweaks
const { lexer } = require('./lexer')
const { parser } = require('./parser')
const { format } = require('./format')
const { toHTML } = require('./stringify')
const {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers
} = require('./tags')

const parseDefaults = {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers,
  includePositions: false
}

function parse(str, opts = {}) {
  const options = Object.assign(parseDefaults, opts)
  const tokens = lexer(str, options)
  const nodes = parser(tokens, options)
  return format(nodes, options)
}

function stringify(ast, opts = {}) {
  const options = Object.assign(parseDefaults, opts)
  return toHTML(ast, options)
}

module.exports = {
  parseDefaults,
  parse,
  stringify
}