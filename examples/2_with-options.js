const { markdownMagic } = require('../lib')

const files = [
  'test/fixtures/md/transform-remote.md',
]

markdownMagic(files, {
  open: 'doc-gen',
  close: 'end-doc-gen',
}).then(({ changes }) => {
  console.log('changes', changes)
})