// const { generateToc } = require('../utils/toc')
const { generateToc } = require('@davidwells/md-utils')
const { findClosestParentHeading } = require('@davidwells/md-utils/find-headings')
const { readFile } = require('../utils/fs')
const details = require('../utils/details')

module.exports = async function sectionToc(api) {
  const { options, currentFileContent, originalFileContent, srcPath, getBlockDetails } = api
  const opts = options || {}
  let { collapseText, collapse } = opts
  /* Sub table of contents */
  const originalBlock = getBlockDetails(originalFileContent)
  const closestHeading = findClosestParentHeading(originalFileContent, originalBlock.block.start)
  // console.log('closestHeading', closestHeading)
  
  const subToc = await generateToc(currentFileContent, {
    ...opts,
    normalizeLevels: true,
    // Set sub table of contents
    subSection: closestHeading,
  })

  if (closestHeading) {
    const headingText = closestHeading.text
    // console.log('BEFORE', linesBefore)
    // console.log('closest parent heading', closestHeading)
    // console.log('headingText', headingText)
    collapseText = collapseText || `${headingText} contents`
    // https://regex101.com/r/MB85zm/1
  }

  if (collapse) {
    return details(subToc.text, collapseText)
  }

  return subToc.text
}