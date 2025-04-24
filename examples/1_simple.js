const { markdownMagic } = require('../src')

const files = [
  // 'test/fixtures/md/transform-remote.md',
  'test/fixtures/md/syntax-mixed.md',
]

markdownMagic(files, {
  open: 'MD-MAGIC-EXAMPLE:START',
  close: 'MD-MAGIC-EXAMPLE:END',
  transforms: {
    LOLZ: (api) => {
      const { transform, settings, content, options } = api
      console.log('api keys', Object.keys(api))
      console.log('transformName', transform)
      console.log('settings', settings)
      // console.log('api', api)
      // console.log('content', content)
      return `nice ${options.dope}`
    }
  }
}).then((result) => {
  console.log('result', result)
})