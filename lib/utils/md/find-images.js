const { onlyUnique, isImage, isRelative } = require('./filters')
const { findLinks, findLiveLinks } = require('./find-links')

// https://regex101.com/r/u2DwY2/2/
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g
// https://regex101.com/r/Uxgu3P/1
const RELATIVE_IMAGES_REGEX = /(<img.*?src=['"])(?!(?:(?:https?|ftp):\/\/|data:))(\.?\/)?(.*?)(['"].*?\/?>)/gim

/**
 * Get image links from content
 * @param {string} content
 * @param {array} [links] - optional links to use to avoid re-parse
 * @returns {array}
 */
function findImages(content = '', opts = {}) {
  const { links, unique = true } = opts
  const foundLinks = (links && Array.isArray(links)) ? links : findLinks(content).all
  const imageLinks = foundLinks.filter(isImage)
  const mdLinks = findMarkdownImages(content)
  const allImageLinks = imageLinks.concat(mdLinks)
  const all = (!unique) ? allImageLinks : allImageLinks.filter(onlyUnique)
  return {
    all,
    live: all.filter((link) => !isRelative(link)),
    relative: all.filter((link) => isRelative(link)),
    md: mdLinks
  }
}

/**
 * Get live url image links
 * @param {string} content
 * @param {array} [links] - optional links to use to avoid re-parse
 * @returns {array}
 */
 function findLiveImages(content = '', links) {
  const foundLinks = (links && Array.isArray(links)) ? links : findLiveLinks(content)
  const imageLinks = foundLinks.filter((link) => {
    return link.match(/(png|jpe?g|gif|webp|svg)$/)
  })
  const mdLinks = findMarkdownImages(content)
  const allImageLinks = imageLinks.concat(mdLinks)

  return allImageLinks
    .filter(onlyUnique)
    .filter((link) => !isRelative(link))
}

function findMarkdownImages(text) {
  let matches
  let imageLinks = []
  while ((matches = MARKDOWN_IMAGE_REGEX.exec(text)) !== null) {
    if (matches.index === MARKDOWN_IMAGE_REGEX.lastIndex) {
      MARKDOWN_IMAGE_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, image, altText ] = matches
    imageLinks.push(image)
  }
  return imageLinks.filter(onlyUnique)
}

/**
 * Get relative image links from content
 * @param {string} content
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
  findLiveImages,
  findRelativeImages,
  findMarkdownImages,
  MARKDOWN_IMAGE_REGEX,
  RELATIVE_IMAGES_REGEX
}
