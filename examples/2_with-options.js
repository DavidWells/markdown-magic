const { markdownMagic } = require('../src')

const files = [
  'test/fixtures/md/transform-remote.md',
]

markdownMagic(files, {
  open: 'docs',
  close: '/docs',
}).then(({ changes }) => {
  console.log('changes', changes)
})