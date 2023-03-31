const path = require('path')
const fs = require('fs')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { findLinks } = require('./find-links')
const { findFrontmatter } = require('./find-frontmatter')

const FILE_PATH = path.join(__dirname, 'fixtures/file-with-frontmatter.md')
const fileWithLinks = fs.readFileSync(FILE_PATH, 'utf-8')

test('Find frontmatter', async () => {
  const frontmatter = findFrontmatter(fileWithLinks)
  console.log('frontmatter', frontmatter)
  assert.is(typeof frontmatter.data, 'object')
})

test.run()