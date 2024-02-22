const { markdownMagic } = require('../lib')

/* By default all .md files in cwd will be processed */
markdownMagic().then((results) => {
  console.log('result keys', Object.keys(results))
})