const { markdownMagic } = require('../lib')

const files = [
  'test/fixtures/md/transform-remote.md',
]

markdownMagic(files).then(({ changes }) => {
  console.log('changes', changes)
})