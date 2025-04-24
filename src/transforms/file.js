const path = require('path')
const fs = require('fs')
const isLocalPath = require('is-local-path')
const { findFrontmatter } = require('@davidwells/md-utils/find-frontmatter')
const { removeLeadingH1 } = require('@davidwells/md-utils/string-utils')

module.exports = function FILE(api) {
  /*
  console.log('FILE API', api)
  /** */
  const { options, srcPath } = api
  if (!options.src) {
    return false
  }
  let fileContents = ''
  if (isLocalPath(options.src)) {
    const fileDir = path.dirname(srcPath)
    const resolvedFilePath = path.resolve(fileDir, options.src)
    try {
      // console.log('READFILE', resolvedFilePath)
      fileContents = fs.readFileSync(resolvedFilePath, 'utf8')
    } catch (e) {
      // if demo path. Todo probably remove
      if (options.src === './path/to/file') {
        return api.content
      }
      console.log(`FILE NOT FOUND ${resolvedFilePath}`)
      throw e
    }
  }

  // trim leading and trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
  fileContents = fileContents.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')

  if (options.removeLeadingH1) {
    fileContents = removeLeadingH1(fileContents)
  }

  const isMarkdown = path.extname(options.src).toLowerCase() === '.md'
  // Shift headers up or down by the specified number of levels if shiftHeaders is enabled and file is markdown
  if (options.shiftHeaders && isMarkdown) {
    fileContents = fileContents.replace(/^(#{1,6})\s/gm, (match, hashes) => {
      const currentLevel = hashes.length;
      const shiftAmount = options.shiftHeaders;
      const newLevel = Math.max(1, Math.min(6, currentLevel + shiftAmount));
      return '#'.repeat(newLevel) + ' ';
    })
  }

  /* automatically trim frontmatter if file is markdown */
  if (isMarkdown && options.trimFrontmatter !== false) {
    const frontmatter = findFrontmatter(fileContents)
    if (frontmatter && frontmatter.frontMatterRaw) {
      fileContents = fileContents.replace(frontmatter.frontMatterRaw, '')
    }
  }

  if (options.textBefore) {
    fileContents = `${options.textBefore}${fileContents}`
  }

  if (options.textAfter) {
    fileContents = `${fileContents}${options.textAfter}`
  }

  return fileContents

  return `<!-- The below content is automatically added from ${options.src} -->
${fileContents}`
}

// maybe support...
function legacyCODE(content, options, config) {

}