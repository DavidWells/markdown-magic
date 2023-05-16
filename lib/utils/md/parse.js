const { parse } = require('micro-mdx-parser')
const { parseFrontmatter } = require('./find-frontmatter')
const { findUnmatchedHtmlTags } = require('./find-unmatched-html-tags')
const { findLinks } = require('./find-links')
const { findDate } = require('./find-date')
const { findCodeBlocks, REMOVE_CODE_BLOCK_REGEX } = require('./find-code-blocks')
const { getLineCount } = require('./utils')

function parseMarkdown(text, opts = {}) {
  const { 
    filePath,
    validator,
    astParser,
    includeAst = true,
    includeLinks = true,
    includeImages = true,
    includeCodeBlocks = true,
    includePositions = false,
    includeRawFrontmatter = false,
  } = opts
  let errors = []
  let result = {}
  let alreadySetError = false
  try {
    result = parseFrontmatter(text)
  } catch (err) {
    console.log(`Broken frontmatter in ${filePath}...`)
    errors.push(err.message)
    alreadySetError = true
  }
  const { data, content = '', frontMatterRaw = '' } = result
  if (!data || !Object.keys(data).length) {
    if (!alreadySetError) {
      errors.push(`Missing or broken frontmatter in ${filePath}. Double check file for --- frontmatter tags`)
    }
  }

  let links
  let images
  if (includeLinks || includeImages) {
    const linkData = findLinks(text, {
      frontmatter: data
    })
    links = linkData.links
    images = linkData.images
  }

  let ast = []
  if (includeAst) {
    /* If custom parser supplied */
    if (astParser) {
      ast = astParser(content, opts)
    } else {
      /* Default parser */
      ast = parse(content, {
        includePositions,
        // offset: {
        //   lineOffset: getLineCount(frontMatterRaw),
        //   charOffset: frontMatterRaw.length 
        // }
      })
    }
  }

  // console.log('html', html)
  // console.log(`htmlTags ${filePath}`, htmlTags)
  let codeBlocks
  if (includeCodeBlocks) {
    codeBlocks = findCodeBlocks(text, { filePath, includePositions })
  }

  // console.log(`codeBlocks ${filePath}`, codeBlocks)
  const tagsErrors = findUnmatchedHtmlTags(text, filePath)

  // const htmlValidationTags = validateHtmlTags(htmlTags, filePath)
  // if (htmlValidationTags && htmlValidationTags.length) {
  //   errors = errors.concat(htmlValidationTags)
  // }

  let htmlValidation = []
  if (typeof validator === 'function') {
    // const contentsNoCodeBlocks = content.replace(REMOVE_CODE_BLOCK_REGEX, '')
    htmlValidation = validator(content, filePath)
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

  const frontmatter = data || {}
  const date = findDate({
    frontmatter,
    filePath
  })

  const parseResult = {}

  if (filePath) {
    parseResult.filePath = filePath
  }

  if (date) {
    parseResult.date = date
  }

  if (includeAst) {
    parseResult.ast = ast
  }

  /* Include frontmatter as data object */
  parseResult.data = frontmatter

  if (includeRawFrontmatter) {
    parseResult.frontMatterRaw = frontMatterRaw
  }

  if (includeLinks) {
    parseResult.links = links
  }

  if (includeImages) {
    parseResult.images = images
  }

  if (includeCodeBlocks) {
    parseResult.codeBlocks = codeBlocks.blocks
  }

  parseResult.content = content
  parseResult.errors = errors

  return parseResult
}

module.exports = {
  parseMarkdown
}