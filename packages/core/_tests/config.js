const path = require('path')
const FIXTURE_DIR = path.join(__dirname, 'fixtures')
const MARKDOWN_FIXTURE_DIR = path.join(FIXTURE_DIR, 'md')
const OUTPUT_DIR = path.join(FIXTURE_DIR, 'output')

module.exports = {
  FIXTURE_DIR,
  MARKDOWN_FIXTURE_DIR,
  OUTPUT_DIR
}