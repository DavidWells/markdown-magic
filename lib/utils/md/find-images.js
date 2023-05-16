const { onlyUnique, isImage, isRelative } = require('./filters')
const { findLinks, findAbsoluteLinks } = require('./find-links')
const { findMarkdownImages, MARKDOWN_IMAGE_REGEX } = require('./find-images-md')

// https://regex101.com/r/Uxgu3P/1
const RELATIVE_IMAGES_REGEX = /(<img.*?src=['"])(?!(?:(?:https?|ftp):\/\/|data:))(\.?\/)?(.*?)(['"].*?\/?>)/gim

/**
 * @typedef {object} findImagesOpts
 * @property {string[]} [links] - optional links to use to avoid re-parse
 * @property {boolean} [unique=true] - ensure links unique
 * @property {Record<string,any>} [frontmatter] - Frontmatter data
 */

/**
 * @typedef {object} findImagesResult
 * @property {string[]} all - All links
 * @property {string[]} absolute - All absolute links
 * @property {string[]} relative - All relative links
 * @property {string[]} md - All md style links
 */

/**
 * Get image links from content
 * @param {string} content
 * @param {findImagesOpts} [opts] - optional links to use to avoid re-parse
 * @returns {findImagesResult}
 */
function findImages(content = '', opts = {}) {
  const { links, unique = true, frontmatter } = opts
  let foundLinks = []
  if (links && Array.isArray(links)) {
    foundLinks = links
  } else {
    const results = findLinks(content, { frontmatter })
    foundLinks = results.links.concat(results.images)
  }
  const imageLinks = foundLinks.filter(isImage)
  const markdownLinks = findMarkdownImages(content)
  const allImageLinks = imageLinks.concat(markdownLinks)
  const all = (!unique) ? allImageLinks : allImageLinks.filter(onlyUnique)
  return {
    all,
    absolute: all.filter((link) => !isRelative(link)),
    relative: all.filter((link) => isRelative(link)),
    md: markdownLinks
  }
}

/**
 * Get absolute url image links
 * @param {string} content
 * @param {array} [links] - optional links to use to avoid re-parse
 * @returns {array}
 */
 function findAbsoluteImages(content = '', links) {
  const foundLinks = (links && Array.isArray(links)) ? links : findAbsoluteLinks(content)
  const imageLinks = foundLinks.filter(isImage)
  const markdownLinks = findMarkdownImages(content)
  const allImageLinks = imageLinks.concat(markdownLinks)

  return allImageLinks
    .filter(onlyUnique)
    .filter((link) => !isRelative(link))
}

/**
 * Get relative image links from content
 * @param {string} text
 * @returns {array}
 */
function findRelativeImages(text) {
  const imgTags = findRelativeImgTags(text) || []
  const mdTags = findMarkdownImages(text).filter(isRelative)
  return imgTags.concat(mdTags)
}

/*
// https://regex101.com/r/SvMfme/1
<img src="img/deploy/button.svg" />
<img src="/img/deploy/button.svg" />
<img src='/img/deploy/button.svg' />
<img src='./img/deploy/button.svg' />
<img src='../img/deploy/button.svg' />
<img src='../../img/deploy/button.svg' />
*/
function findRelativeImgTags(block) {
  let matches
  let relLinks = []
  while ((matches = RELATIVE_IMAGES_REGEX.exec(block)) !== null) {
    if (matches.index === RELATIVE_IMAGES_REGEX.lastIndex) {
      RELATIVE_IMAGES_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, _, start, link ] = matches
    relLinks.push(`${start || ''}${link}`)
  }
  return relLinks.filter(onlyUnique)
}

module.exports = {
  findImages,
  findAbsoluteImages,
  findRelativeImages,
  findMarkdownImages,
  MARKDOWN_IMAGE_REGEX,
  RELATIVE_IMAGES_REGEX
}
