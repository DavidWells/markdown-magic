const { arrayIncludes }= require('./compat')

// Old
function formatAttributes(attributes) {
  return attributes.reduce((attrs, attribute) => {
    const {key, value} = attribute
    if (value === null) {
      return `${attrs} ${key}`
    }
    const quoteEscape = value.indexOf('\'') !== -1
    const quote = quoteEscape ? '"' : '\''
    return `${attrs} ${key}=${quote}${value}${quote}`
  }, '')
}

function toHTML(tree, options) {
  return tree.map((node) => {
    if (node.type === 'text') {
      return node.content
    }
    if (node.type === 'comment') {
      return `<!--${node.content}-->`
    }
    const {tagName, propsRaw, children} = node
    // @TODO update prop parsing to keep new lines
    const propsString = (propsRaw) ? ` ${propsRaw}` : ''
    const isSelfClosing = arrayIncludes(options.voidTags, tagName.toLowerCase())
    return isSelfClosing
      ? `<${tagName}${propsString}>`
      : `<${tagName}${propsString}>${toHTML(children, options)}</${tagName}>`
  }).join('')
}

module.exports = {
  formatAttributes,
  toHTML
}