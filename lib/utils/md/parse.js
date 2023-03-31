// const { validateHtml } = require('./validate-html')
const { findFrontmatter } = require('./find-frontmatter')
const { parse } = require('micro-mdx-parser')
const { getLineCount } = require('./utils')
const { findUnmatchedHtmlTags } = require('./find-unmatched-html-tags')
const { findLinks } = require('./find-links')
const { findDate } = require('./find-date')
const { findCodeBlocks, REMOVE_CODE_BLOCK_REGEX } = require('./find-code-blocks')
// const { findImages, findLiveImages } = require('./find-images')
// const { findHtmlTags } = require('./find-html-tags')

function parseMarkdown(text, opts = {}) {
  const { filePath, validateHtml } = opts
  let errors = []
  let frontmatter = {}
  let alreadySetError = false
  try {
    frontmatter = findFrontmatter(text, filePath)
  } catch (err) {
    console.log(`Broken frontmatter in ${filePath}...`)
    errors.push(err.message)
    alreadySetError = true
  }
  const { data, content = '', rawFrontMatter = '' } = frontmatter
  if (!data || !Object.keys(data).length) {
    if (!alreadySetError) {
      errors.push(`Missing or broken frontmatter in ${filePath}. Double check file for --- frontmatter tags`)
    }
  }

  // const imagesInYml = findLinksInFrontMatter(data, findLiveImages)
  // console.log('linksInYml', linksInYml)
  // const links = findLiveLinks(text)
  //console.log(`links ${filePath}`, links)
  // const relativeLinks = findRelativeLinks(text)
  // console.log(`relativeLinks ${filePath}`, relativeLinks)
  /* gets all images in file */
  // const images = findLiveImages(text) // findImages(text)
  // console.log(`images ${filePath}`, images)
  // const htmlTags = findHtmlTags(text)
  const linkData = findLinks(text)

  const html = parse(content, {
    includePositions: true,
    offset: {
      lineOffset: getLineCount(rawFrontMatter),
      charOffset: rawFrontMatter.length 
    }
  })

  // console.log('html', html)
  // console.log(`htmlTags ${filePath}`, htmlTags)
  const codeBlocks = findCodeBlocks(text, filePath)
  // console.log(`codeBlocks ${filePath}`, codeBlocks)
  const tagsErrors = findUnmatchedHtmlTags(text, filePath)

  // const htmlValidationTags = validateHtmlTags(htmlTags, filePath)
  // if (htmlValidationTags && htmlValidationTags.length) {
  //   errors = errors.concat(htmlValidationTags)
  // }

  let htmlValidation = []
  if (validateHtml) {
    const contentsNoCodeBlocks = content.replace(REMOVE_CODE_BLOCK_REGEX, '')
    htmlValidation = validateHtml(contentsNoCodeBlocks, filePath)
  }

  if (htmlValidation && htmlValidation.length) {
    // console.log('htmlValidation', htmlValidation)
    errors = errors.concat(htmlValidation)
  }

  if (tagsErrors && tagsErrors.length) {
    errors = errors.concat(tagsErrors)
  }

  if (codeBlocks.errors && codeBlocks.errors.length) {
    errors = errors.concat(codeBlocks.errors)
  }

  const frontMatterData = data || {}
  const date = findDate({
    frontmatter: frontMatterData, 
    filePath
  })

  const markdownInfo = {
    ...(filePath) ? { filePath } : {},
    ...(date) ? { date } : {},
    ast: html,
    data: frontMatterData,
    links: linkData.links,
    images: linkData.images,
    codeBlocks,
    content,
    errors,
    // frontMatterRaw: rawFrontMatter,
    // ...frontmatter
  }

  /* // Debugger
  const path = require('path')
  if (path.basename(filePath)=== '2020-06-30-welcome-to-vendia.md') {
    // console.log('text', text)
    // console.log('Frontmatter')
    // console.log(data)
    // console.log('findLinks')
    // deepLog(links)
    // console.log('components')
    // deepLog(components)
    console.log('markdownInfo')
    deepLog(markdownInfo)

    deepLog(stringify(html))
    process.exit(1)
  }
  /** */

  return markdownInfo
}

module.exports = {
  parseMarkdown
}