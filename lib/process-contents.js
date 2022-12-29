const { parseBlocks } = require('./block-parser')
const { deepLog } = require('./utils/logs')
const { getCodeLocation } = require('./utils')
const { indentString, trimString } = require('./utils/text')
const { OPEN_WORD, CLOSE_WORD } = require('./defaults')

/**
 * Pull comment blocks out of content and process them
 * @param {string} text 
 * @param {object} config 
 * @returns 
 */
 async function processContents(text, config = {}) {
  const {
    srcPath,
    outputPath,
    open = OPEN_WORD, // 'DOCS:START',
    close = CLOSE_WORD, // 'DOCS:END',
    syntax = 'md',
    transforms,
    beforeMiddleware = [],
    afterMiddleware = [],
    debug = false,
  } = config

  let foundBlocks = {}
  try {
    foundBlocks = parseBlocks(text, {
      syntax,
      open,
      close,
    })
  } catch (e) {
    throw new Error(`${e.message} in file ${srcPath}\n`)
  }

  if (debug) {
    console.log(`foundBlocks ${srcPath}`)
    deepLog(foundBlocks)
  }
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
  const updatedContents = await transformsToRun.reduce(async (contentPromise, originalMatch) => {
    const md = await contentPromise
    /* Apply Before middleware to all transforms */
    const match = await applyMiddleware(originalMatch, md, beforeMiddleware)
    const { block, content, open, close, transform, options, context } = match
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
    if (debug) {
      console.log('afterContent', afterContent)
    }

    if (!currentTransformFn) {
      missingTransforms.push(afterContent)
      // console.log(`Missing "${transform}" transform`)
    }

    const newContent = afterContent.content.value
    const formattedNewContent = (options.noTrim) ? newContent : trimString(newContent)
    // console.log('formattedNewContent', formattedNewContent)
    /* Remove any conflicting imported comments */
    const fix = removeConflictingComments(formattedNewContent, foundBlocks.commentOpen, COMMENT_CLOSE_REGEX)
    // const fix = stripAllComments(formattedNewContent, foundBlocks.commentOpen, COMMENT_CLOSE_REGEX)

    // console.log('COMMENT_CLOSE_REGEX', COMMENT_CLOSE_REGEX)
    // console.log('formattedNewContent', formattedNewContent)
    // console.log('fix', fix)
    const preserveIndent = (true || options.preserveIndent) ? block.indentation.length + match.content.indentation : block.indentation.length
    const indent = indentString(fix, preserveIndent)
    const newCont = `${openTag}${indent}${closeTag}`
    /* Replace original contents */
    const newContents = md.replace(block.value, newCont)
    return Promise.resolve(newContents)
  }, Promise.resolve(text))

  if (debug) {
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
    // console.log('original text between', `"${getTextBetweenChars(md, contentStart, contentEnd)}"`)
    // console.log('original block between', `"${getTextBetweenChars(md, start, end)}"`)
  }
  /** */

  // console.log('detect slow srcPath', srcPath)

  const result = {
    /* Has markdown content changed? */
    isChanged: text !== updatedContents,
    isNewPath: srcPath !== outputPath,
    srcPath,
    outputPath,
    // config,
    transforms: transformsToRun,
    missingTransforms,
    originalContents: text,
    updatedContents
  }

  // console.log('result')
  // deepLog(result)

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
    settings: {
      ...rest,
      regex: stuff.regex,
    },

    // blockContent: stuff.content.value,
    fileContent: stuff.currentContents,
    originalFileContent: stuff.originalContents,
    /* Methods */
    getOriginalContent: () => stuff.originalContents,
    getOriginalBlock: () => stuff,
    getCurrentBlock: () => {
      /* Re-parse current file for updated positions */
      const updatedBlocks = parseBlocks(stuff.currentContents, {
        syntax: opts.syntax,
        open: opts.open,
        close: opts.close,
      })
   
      const matchingBlocks = updatedBlocks.blocks.filter((block) => {
        return block.open.value === stuff.open.value
      })

      if (!matchingBlocks.length) {
        return {}
      }
      let foundBlock = matchingBlocks[0]

      if (matchingBlocks.length > 1) {
        foundBlock = matchingBlocks.filter((block) => {
          return block.index === stuff.index
        })[0]
      }

      const location = getCodeLocation(stuff.srcPath, foundBlock.block.lines[0])
      return [ foundBlock, location ]
    },
  }
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
    if (a.transform === 'TOC') return 1
    if (b.transform === 'TOC') return -1
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