const { markdownMagic } = require('../lib')

const files = [
  // 'test/fixtures/md/transform-remote.md',
  'test/fixtures/md/syntax-mixed.md',
]

markdownMagic(files, {
  open: 'MD-MAGIC-EXAMPLE:START',
  close: 'MD-MAGIC-EXAMPLE:END',
  transforms: {
    LOLZ: (api) => {
      console.log(api)
      const { content, options } = api
      // console.log('content', content)
      return `nice ${options.dope}`
    }
  }
}).then(({ changes }) => {
  console.log('changes', changes)
})