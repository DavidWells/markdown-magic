
function splitHead(str, sep) {
  const idx = str.indexOf(sep)
  if (idx === -1) return [str]
  return [str.slice(0, idx), str.slice(idx + sep.length)]
}

function unquote(str) {
  const car = str.charAt(0)
  const end = str.length - 1
  const isQuoteStart = car === '"' || car === "'"
  if (isQuoteStart && car === str.charAt(end)) {
    return str.slice(1, end)
  }
  return str
}

function format(nodes, options) {
  return nodes.map(node => {
    const type = node.type
    let outputNode = { type, content: node.content }
    if (type === 'element') {
      outputNode = {
        // TODO maybe harden with https://github.com/riot/dom-nodes
        type: (/^[A-Z]/.test(node.tagName)) ? 'component' : type,
        // isReactComponent: /^[A-Z]/.test(node.tagName),
        tagName: node.tagName,
        props: node.props,
        propsRaw: node.propsRaw,
        children: format(node.children, options)
      }
    }
    if (options.includePositions) {
      if (options.offset) {
        const { lineOffset, charOffset } = options.offset
        node.position.start.line = node.position.start.line + lineOffset
        node.position.start.index = node.position.start.index + charOffset
        node.position.end.line = node.position.end.line + lineOffset
        node.position.end.index = node.position.end.index + charOffset
      }
      outputNode.position = node.position
    }
    return outputNode
  })
}

// Old
function formatAttributes (attributes) {
  return attributes.map(attribute => {
    const parts = splitHead(attribute.trim(), '=')
    const key = parts[0]
    const value = typeof parts[1] === 'string'
      ? unquote(parts[1])
      : null
    return {key, value}
  })
}

module.exports = {
  splitHead,
  unquote,
  format,
  formatAttributes
}