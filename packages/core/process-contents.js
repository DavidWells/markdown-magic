const { parseBlocks } = require('../block-parser/src/index')
const { deepLog } = require('./utils/logs')
const { getCodeLocation } = require('./utils')
const { indentString, trimString } = require('./utils/text')
const { OPEN_WORD, CLOSE_WORD, SYNTAX } = require('./defaults')

/**
 * Configuration object for processing contents.
 * @typedef {Object} ProcessContentConfig
 * @property {string} srcPath - The source path.
 * @property {string} outputPath - The output path.
 * @property {string} [open=OPEN_WORD] - The opening delimiter.
 * @property {string} [close=CLOSE_WORD] - The closing delimiter.
 * @property {string} [syntax='md'] - The syntax type.
 * @property {Array<Function>} [transforms=[]] - The array of transform functions.
 * @property {Array<Function>} [beforeMiddleware=[]] - The array of middleware functions to be executed before processing.
 * @property {Array<Function>} [afterMiddleware=[]] - The array of middleware functions to be executed after processing.
 * @property {boolean} [debug=false] - Enable debug mode.
 * @property {boolean} [removeComments=false] - Remove comments from the processed contents.
 */

/**
 * Pull comment blocks out of content and process them
 * @param {string} text 
 * @param {ProcessContentConfig} config 
 * @returns 
 */
async function processContents(text, config) {
  const opts = config || {}

  const {
    srcPath,
    outputPath,
    open = OPEN_WORD, // 'DOCS:START',
    close = CLOSE_WORD, // 'DOCS:END',
    syntax = SYNTAX, // 'md'
    transforms = [],
    beforeMiddleware = [],
    afterMiddleware = [],
    debug = false,
    removeComments = false
  } = opts

  /*
  console.log('Open word', open)
  console.log('Close word', close)
  console.log('syntax', syntax)
  // console.log('text', text)
  /** */

  let foundBlocks = {}
  try {
    foundBlocks = parseBlocks(text, {
      syntax,
      open,
      close,
    })
  } catch (e) {
    throw new Error(`${e.message}\nFix content in ${srcPath}\n`)
  }

  // if (debug) {
  //   console.log(`foundBlocks ${srcPath}`)
  //   deepLog(foundBlocks)
  // }
  /*
  deepLog(foundBlocks)
  process.exit(1)
  /** */
  const { COMMENT_OPEN_REGEX, COMMENT_CLOSE_REGEX } = foundBlocks

  const blocksWithTransforms = foundBlocks.blocks
    .filter((block) => block.type)
    .map((block, i) => {
      const transform = block.type
      delete block.type
      return Object.assign({ transform }, block)
    })

  
  const regexInfo = {
    blocks: foundBlocks.pattern,
    open: COMMENT_OPEN_REGEX,
    close: COMMENT_CLOSE_REGEX,
  }
  // console.log('blocksWithTransforms', blocksWithTransforms)
  // process.exit(1)

  const transformsToRun = sortTranforms(blocksWithTransforms, transforms)
  // .map((transform) => {
  //   return {
  //     ...transform,
  //     srcPath
  //   }
  // })
  // console.log('transformsToRun', transformsToRun)

  // if (!transformsToRun.length) {
  //   process.exit(1)
  // }
  // console.log('transformsToRun', transformsToRun)
  let missingTransforms = []
  let updatedContents = await transformsToRun.reduce(async (contentPromise, originalMatch) => {
    const md = await contentPromise
    /* Apply Before middleware to all transforms */
    const match = await applyMiddleware(originalMatch, md, beforeMiddleware)
    const { block, content, open, close, transform, options, context } = match
    // console.log("MATCH", match)
    const closeTag = close.value
    const openTag = open.value
    
    /* Run transform plugins */
    let tempContent = content.value
    // console.log('transform', transform)
    const currentTransformFn = getTransform(transform, transforms)
    /* Run each transform */
    if (currentTransformFn) {
      // console.log('context', context)
      let returnedContent
      /* DISABLED legacy syntax */
      /* // Support for legacy syntax... maybe later
      if (context && context.isLegacy) {
        console.log(`CALL legacy ${transform}`, srcPath)
        // backward compat maybe
        // CODE(content, options, config)
        returnedContent = await currentTransformFn(content.value, options, { 
          originalPath: srcPath
        })
      } else {
        returnedContent = await currentTransformFn(transformApi({
          srcPath,
          ...match,
          regex: regexInfo,
          originalContents: text,
          currentContents: md,
        }, config))
      }
      /** */

      returnedContent = await currentTransformFn(
        transformApi({
          srcPath,
          ...match,
          regex: regexInfo,
          originalContents: text,
          currentContents: md,
        }, config)
      )

      /* Run each transform */
      // console.log('config', config)

      // console.log('returnedContent', returnedContent)
      // process.exit(1)

     
      if (returnedContent) {
        tempContent = returnedContent
      }
    }

    /* Apply After middleware to all transforms */
    const afterContent = await applyMiddleware({
      ...match,
      ...{
        content: {
          ...match.content,
          value: tempContent
        }
      }
    }, md, afterMiddleware)
    /*
    console.log('afterContent', afterContent)
    process.exit(1)
    /** */

    if (debug) {
      // console.log('afterContent', afterContent)
    }

    if (!currentTransformFn) {
      missingTransforms.push(afterContent)
      // console.log(`Missing "${transform}" transform`)
    }

    const newContent = afterContent.content.value
    const formattedNewContent = (options.noTrim) ? newContent : trimString(newContent)
    // console.log('formattedNewContent', formattedNewContent)
    /* Remove any conflicting imported comments */
    const fix = removeConflictingComments(formattedNewContent, COMMENT_OPEN_REGEX, COMMENT_CLOSE_REGEX)
    /*
    console.log('fix')
    deepLog(fix)
    process.exit(1)
    /** */
    if (options.removeComments) {
      // console.log('removeComments', options.removeComments)
    }
    // const fix = stripAllComments(formattedNewContent, foundBlocks.COMMENT_OPEN_REGEX, COMMENT_CLOSE_REGEX)

    // console.log('COMMENT_CLOSE_REGEX', COMMENT_CLOSE_REGEX)
    // console.log('formattedNewContent', formattedNewContent)
    // console.log('fix', fix)

    let preserveIndent = 0
    if (match.content.indentation) {
      preserveIndent = match.content.indentation
    } else if (preserveIndent === 0) {
      preserveIndent = block.indentation.length
    }
    // console.log('preserveIndent', preserveIndent)
    let addTrailingNewline = ''
    if (context.isMultiline && !fix.endsWith('\n') && fix !== '' && closeTag.indexOf('\n') === -1) {
      addTrailingNewline = '\n'
    }

    let addLeadingNewline = ''
    if (context.isMultiline && !fix.startsWith('\n') && fix !== '' && openTag.indexOf('\n') === -1) {
      addLeadingNewline = '\n'
    }

    let fixWrapper = ''
    /* If block wasn't multiline but the contents ARE multiline fix the block */
    if (!context.isMultiline && fix.indexOf('\n') > -1) {
      fixWrapper = '\n'
    }

    // console.log("OPEN TAG", `"${openTag}"`)
    // console.log("CLOSE TAG", `"${closeTag}"`)
    
    const indent = addLeadingNewline + indentString(fix, preserveIndent) + addTrailingNewline
    const newCont = `${openTag}${fixWrapper}${indent}${fixWrapper}${closeTag}`
    /* Replace original contents */
    // Must use replacer function because strings get coerced to regex or something
    const newContents = md.replace(block.value, () => newCont)
    /*
    deepLog(newContents)
    process.exit(1)
    /** */
    return Promise.resolve(newContents)
  }, Promise.resolve(text))

  // console.log('updatedContents')
  // deepLog(updatedContents)
  // process.exit(1)

  // if (debug) {
  //   console.log('Output Markdown')
  //   console.log(updatedContents)
  // }

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
    // console.log('original text between', `"${getTextBetweenChars(md, contentStart, contentEnd)}"`)
    // console.log('original block between', `"${getTextBetweenChars(md, start, end)}"`)
  }
  /** */

  // console.log('detect slow srcPath', srcPath)

  const isNewPath = srcPath !== outputPath

  if (removeComments && !isNewPath) {
    throw new Error('"removeComments" can only be used if "outputPath" option is set. Otherwise this will break doc generation.')
  }

  /* Strip block comments from output files */
  const stripComments = isNewPath && removeComments

  // console.log('srcPath', srcPath)
  // console.log('outputPath', outputPath)
  // console.log('updatedContents', updatedContents)
  // console.log('text', text)
  // process.exit(1)
  const result = {
    /* Has markdown content changed? */
    isChanged: text !== updatedContents,
    isNewPath,
    stripComments,
    srcPath,
    outputPath,
    // config,
    transforms: transformsToRun,
    missingTransforms,
    originalContents: text,
    updatedContents,
  }
  /*
  console.log('result')
  deepLog(result)
  process.exit(1)
  /** */
  return result
}

function transformApi(stuff, opts) {
  const { transforms, srcPath, outputPath, ...rest } = opts
  return {
    transform: stuff.transform,
    content: stuff.content.value,
    options: stuff.options || {},
    srcPath: stuff.srcPath,
    outputPath: outputPath,
    /* Library settings */
    settings: {
      ...rest,
      regex: stuff.regex,
    },
    // blockContent: stuff.content.value,
    currentFileContent: stuff.currentContents,
    originalFileContent: stuff.originalContents,
    /* Methods */
    getCurrentContent: () => stuff.currentContents,
    getOriginalContent: () => stuff.originalContents,
    getOriginalBlock: () => stuff,
    getBlockDetails: (content) => {
      /* Re-parse current file for updated positions */
      return getDetails({
        contents: content || stuff.currentContents,
        openValue: stuff.open.value,
        srcPath: stuff.srcPath,
        index: stuff.index,
        opts: opts
      })
    },
    // getOriginalBlockDetails: () => {
    //   return getDetails({
    //     contents: stuff.originalContents,
    //     openValue: stuff.open.value,
    //     srcPath: stuff.srcPath,
    //     index: stuff.index,
    //     opts: opts
    //   })
    // },
  }
}

function getDetails({
  contents,
  openValue,
  srcPath,
  index,
  opts
}) {
  /* Re-parse current file for updated positions */
  const blockData = parseBlocks(contents, opts)
  // console.log('blockData', blockData)

  const matchingBlocks = blockData.blocks.filter((block) => {
    return block.open.value === openValue
  })

  if (!matchingBlocks.length) {
    return {}
  }

  let foundBlock = matchingBlocks[0]
  if (matchingBlocks.length > 1 && index) {
    foundBlock = matchingBlocks.filter((block) => {
      return block.index === index
    })[0]
  }

  if (srcPath) {
    const location = getCodeLocation(srcPath, foundBlock.block.lines[0])
    foundBlock.sourceLocation = location
  }
  return foundBlock
}

/**
 * Remove conflicting comments that might have been inserted from transforms
 * @param {*} content 
 * @param {*} openPattern 
 * @param {*} closePattern 
 * @returns
 */
 function removeConflictingComments(content, openPattern, closePattern) {
  // console.log('openPattern', openPattern)
  // console.log('closePattern', closePattern)
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
    .replace(closePattern, '')
    // .replaceAll(closeTag, '')
    /* Trailing new line */
    .replace(/\n$/, '')
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
        content: {
          ...realAcc.content,
          value: updatedContent
        }
      }
    })
  }, Promise.resolve(data))
}

/**
 * Get Transform function
 * @param {string} name - transform name
 * @param {object} transforms - transform fns
 * @returns {function}
 */
function getTransform(name, transforms = {}) {
  return transforms[name] || transforms[name.toLowerCase()]
}

function sortTranforms(foundTransForms, registeredTransforms) {
  // console.log('transforms', transforms)
  if (!foundTransForms) return []
  return foundTransForms.sort((a, b) => {
    // put table of contents (TOC) at end of tranforms
    if (a.transform === 'TOC' || a.transform === 'sectionToc') return 1
    if (b.transform === 'TOC' || b.transform === 'sectionToc') return -1
    return 0
  }).map((item) => {
    if (getTransform(item.transform, registeredTransforms)) {
      return item
    }
    return {
      ...item,
      context: {
        ...item.context,
        isMissing: true,
      }
    }
  })
}

module.exports = {
  processContents
}