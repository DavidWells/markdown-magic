const { findFrontmatter } = require('@davidwells/md-utils/find-frontmatter')
const { removeLeadingH1 } = require('@davidwells/md-utils/string-utils')

function formatMd(content, options = {}) {
  let fileContents = content
  if (options.removeLeadingH1 || options.stripFirstH1) {
    fileContents = removeLeadingH1(fileContents)
  }
  
  // Shift headers up or down by the specified number of levels if shiftHeaders is enabled and file is markdown
  if (options.shiftHeaders) {
    fileContents = fileContents.replace(/^(#{1,6})\s/gm, (match, hashes) => {
      const currentLevel = hashes.length;
      const shiftAmount = Number(options.shiftHeaders);
      const newLevel = Math.max(1, Math.min(6, currentLevel + shiftAmount));
      return '#'.repeat(newLevel) + ' ';
    })
  }

  /* automatically trim frontmatter if file is markdown */
  if (options.trimFrontmatter !== false) {
    const frontmatter = findFrontmatter(fileContents)
    if (frontmatter && frontmatter.frontMatterRaw) {
      fileContents = fileContents.replace(frontmatter.frontMatterRaw, '')
    }
  }

  return fileContents
}

module.exports = {
  formatMd
}