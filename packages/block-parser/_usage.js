const { parseBlocks } = require('./src')
const { deepLog } = require('./test/logs')
const { normalizeBlocks } = require('./test/utils')

const htmlAndMarkdown = `
<!-- docs inlineExample foo={{ rad: 'bar' }}-->99<!--/docs-->

<!-- docs fooBar isCool -->
Stuff inside the block
<!--/docs-->
`
const one = parseBlocks(htmlAndMarkdown, {
  open: 'docs',
  close: '/docs'
})

deepLog(normalizeBlocks(one.blocks))


// const yaml = `
// # This is a comment 

// foo: bar
// baz: 123

// ## CodeGen transform ##
// stuff that will be transformed
// ## /CodeGen ##
// `
// const two = parseBlocks(yaml, {
//   open: 'CodeGen',
//   close: '/CodeGen',
//   syntax: 'yaml'
// })
// deepLog(two)