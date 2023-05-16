const { onlyUnique } = require('./filters')

// https://regex101.com/r/u2DwY2/2/
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g

/**
 * Get markdown style images from text
 * @param {string} text
 * @returns {string[]}
 */
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

module.exports = {
  findMarkdownImages,
  MARKDOWN_IMAGE_REGEX
}