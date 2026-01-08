const { parseBlocks } = require('./src')

const content = `
  <!-- block isCool optionOne=foo optionTwo="bar"-->
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
  magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
  pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
  laborum.
  <!-- /block -->
`

const result = parseBlocks(content, {
  // open: 'auto',
  // close: '/auto',
  // firstArgIsType: true,
})

console.log('blocks found:', result.blocks.length)
console.log('blocks', JSON.stringify(result.blocks, null, 2))
