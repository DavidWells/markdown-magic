const path = require('path')
const fs = require('fs').promises
const { getTextBetween, parseBlocks } = require('./utils/new-parser')

async function processContents({ 
  filePath, 
  syntax,
  open,
  close,
  transforms,
  beforeMiddelwares,
  afterMiddelwares,
  DEBUG = false
}) {
  const syntaxType = syntax || path.extname(filePath).replace(/^\./, '')
  const originalContents = await fs.readFile(filePath, 'utf8')
  
  const foundBlocks = parseBlocks(originalContents, {
    syntax: syntaxType,
    open,
    close,
  })

  if (DEBUG) {
    console.log('foundBlocks')
    console.log(foundBlocks)
  }

  const transformsToRun = sortPlugins(foundBlocks.transforms)
  // console.log('transformsToRun', transformsToRun)

  // if (!transformsToRun.length) {
  //   process.exit(1)
  // }

  let missingTransforms = []
  const updatedContents = await transformsToRun.reduce(async (updatedContent, ogmatch) => {
    const md = await updatedContent
    /* Apply Before middleware to all transforms */
    const match = await applyMiddleware(ogmatch, md, beforeMiddelwares)
    const { block, raw, transform, args } = match
    const { openTag, closeTag, content, contentStart, contentEnd, start, end } = block
    
    /* Run transform plugins */
    let tempContent = content
    if (transforms[transform]) {
      tempContent = await transforms[transform](match, md)
    }

    /* Apply After middleware to all transforms */
    const afterContent = await applyMiddleware({
      ...match,
      ...{
        block: {
          ...match.block,
          content: tempContent
        }
      }
    }, md, afterMiddelwares)
    if (DEBUG) {
      console.log('afterContent', afterContent)
    }

    if (!transforms[transform]) {
      missingTransforms.push(afterContent)
      console.log(`Missing "${transform}" transform`)
    }

    const newContent = afterContent.block.content
    const formattedNewContent = (args.noTrim) ? newContent : smartTrim(newContent)
    /* Remove any conflicting imported comments */
    // const fix = removeConflictingComments(formattedNewContent, foundBlocks.commentOpen, foundBlocks.commentClose)
    const fix = stripAllComments(formattedNewContent, foundBlocks.commentOpen, foundBlocks.commentClose)
    // console.log('foundBlocks.commentClose', foundBlocks.commentClose)
    // console.log('formattedNewContent', formattedNewContent)
    // console.log('fix', fix)
    const preserveIndent = (true || args.preserveIndent) ? block.indentation.length + block.contentIndent : block.indentation.length
    const indent = indentString(fix, preserveIndent)
    const newCont = `${openTag}${indent}${closeTag}`
    /* Replace original contents */
    const newContents = md.replace(raw.block, newCont)
    return Promise.resolve(newContents)
  }, Promise.resolve(originalContents))

  if (DEBUG) {
    console.log('Output Markdown')
    console.log(updatedContents)
  }

  /*
  if (missingTransforms.length) {
    console.log('missingTransforms', missingTransforms)
    let matchOne = missingTransforms[1]
    matchOne = missingTransforms[missingTransforms.length - 1]
    // console.log('matchOne', matchOne)
    const { block, transform, args } = matchOne
    const { openTag, closeTag, content, contentStart, contentEnd, start, end} = block

    // console.log('contentStart', contentStart)
    // console.log('contentEnd', contentEnd)
    // console.log('original text between', `"${getTextBetween(md, contentStart, contentEnd)}"`)
    // console.log('original block between', `"${getTextBetween(md, start, end)}"`)
  }
  /** */

  return {
    filePath,
    transforms: transformsToRun,
    missingTransforms,
    originalContents,
    updatedContents
  }
}

function applyMiddleware(data, md, middlewares) {
  return middlewares.reduce(async (acc, curr) => {
    const realAcc = await acc
    // console.log(`Running "${curr.name}" Middleware on "${realAcc.transform}" block`)
    const updatedContent = await curr.transform(realAcc, md)
    // realAcc.block.content = updatedContent
    return Promise.resolve({
      ...realAcc,
      ...{
        block: {
          ...realAcc.block,
          content: updatedContent
        }
      }
    })
  }, Promise.resolve(data))
}

/**
 * Trim leading & trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
 * @param {string} str 
 * @returns string
 */
function smartTrim(str) {
  return str.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')
}

function stripAllComments(block) {
  const pattern = new RegExp(`([^\\s]*)?([ \\t]*)?(<!-+\\s?([\\s\\S]*?)?-+>)([^\\s<]*)?(\n{1,2})?`, 'gi')

  // console.log('closeTagRegex', closeTagRegex)
  let matches
  let remove = []
  while ((matches = pattern.exec(block)) !== null) {
    if (matches.index === pattern.lastIndex) {
      pattern.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, leadingText, leadingSpace, comment, insideComment, trailingText, trailingNewLine ] = matches
    /*
    console.log('match', match)
    console.log('leadingText', leadingText)
    console.log('leadingSpace', leadingSpace)
    console.log('comment', comment)
    console.log('insideComment', insideComment)
    console.log('trailingText', trailingText)
    console.log('trailingNewLine', trailingNewLine)
    /** */
    const newLineCount = (trailingNewLine || '').length
    const trailing = (!trailingText && newLineCount > 1) ? `${trailingNewLine || ''}` : ''
    const leading = (leadingSpace) ? leadingSpace.slice(1) : ''
    remove.push(`${leading}${comment}${trailing}`)
  }
  return remove.reduce((acc, curr) => {
    return acc.replaceAll(curr, '')
  }, block)
}

/**
 * Remove conflicting comments that might have been inserted from transforms
 * @param {*} content 
 * @param {*} openPattern 
 * @param {*} closePattern 
 * @returns 
 */
function removeConflictingComments(content, openPattern, closePattern) {
  const removeOpen = content.replace(openPattern, '')
  // TODO this probably needs to be a loop for larger blocks
  closePattern.lastIndex = 0; // reset regex
  const hasClose = closePattern.exec(content)
  // console.log('closePattern', closePattern)
  // console.log('has', content)
  // console.log('hasClose', hasClose)
  if (!hasClose) {
    return removeOpen
  }
  const closeTag = `${hasClose[2]}${hasClose[3] || ''}`
  // console.log('closeTag', closeTag)
  return removeOpen
    .replaceAll(closeTag, '')
    /* Trailing new line */
    .replace(/\n$/, '')
}
 
function sortPlugins(data) {
  return data.sort((a, b) => {
    // put table of contents (TOC) at end of tranforms
    if (a.transform === 'TOC') return 1
    if (b.transform === 'TOC') return -1
    return 0
  })
}

function indentString(string, count = 1, options = {}) {
	const {
		indent = ' ',
		includeEmptyLines = false
	} = options;
	if (count === 0) return string
	const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm
	return string.replace(regex, indent.repeat(count))
}

module.exports = {
  processContents
}