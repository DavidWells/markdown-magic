const { markdownMagic } = require('../lib')

/* By default all .md files in cwd will be processed */
markdownMagic().then(({ changes }) => {
  console.log('changes', changes)
})