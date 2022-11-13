const path = require('path')
const fs = require('fs').promises
const { glob, globWithGit } = require('smart-glob')
const isValidFile = require('is-valid-path')
const { deepLog, success, error, info } = require('./utils/logs')
const { getSyntaxInfo } = require('./utils/syntax')
const { onlyUnique } = require('./utils')
const { getBlockRegex } = require('./block-parser')
const codeTransform = require('./transforms/code')
const fileTransform = require('./transforms/file')
const tocTransform = require('./transforms/toc')
const wordCountTransform = require('./transforms/wordCount')
const remoteTransform = require('./transforms/remote')

const { indentString, trimString, getRowAndColumnFromCharPos, getTextBetweenChars } = require('./utils/text')
const { parseBlocks } = require('./block-parser')
const { writeFile, resolveOutputPath, resolveFlatPath } = require('./utils/fs')
const LINE = '────────────────────────────────────────'
// const diff = require('../misc/old-test/utils/diff')

const defaultTransforms = {
  CODE: codeTransform,
  FILE: fileTransform,
  TOC: tocTransform,
  wordCount: wordCountTransform,
  remote: remoteTransform
}

const OPEN_WORD = 'doc-gen'
const CLOSE_WORD = 'end-doc-gen'
const DEFAULT_GLOB_PATTERN = '**/**.md'

async function markdownMagic(globOrOpts, options = {}) {
  let opts = {}
  let globPat
  if (typeof globOrOpts === 'string' || Array.isArray(globOrOpts)) {
    opts = options
    globPat = globOrOpts
  } else if (typeof globOrOpts === 'object') {
    opts = globOrOpts
  }
  const { 
    transforms,
    outputDir,
    outputFlatten = false,
    open = OPEN_WORD,
    close = CLOSE_WORD,
    useGitGlob = false, 
    failOnMissingTransforms = false,
    dryRun = false,
    debug = true,
  } = opts
  // console.log('outputDir', outputDir)
  
  const cwd = opts.cwd || process.cwd()
  // console.log('cwd', cwd)
  const globPattern = globPat || globOrOpts.glob
  // console.log('globPattern', globPattern)

  const useTransforms = Object.assign({}, defaultTransforms, transforms)
  let globs = []
  if (!globPattern) {
    globs = [ DEFAULT_GLOB_PATTERN ]
  } else if (Array.isArray(globPattern)) {
    globs = globPattern
  } else if (typeof globPattern === 'string') {
    globs = [ globPattern ]
  }
  opts.glob = globs

  info(`Running Markdown Magic:`)
  logCommentBlockSyntax({
    syntax: opts.syntax || 'md',
    open,
    close
  })

  if (dryRun || debug) {
    info(`Glob patterns:`)
    console.log(globs)
    console.log()
    /*
    process.exit(1)
    /** */
  }

  const globFn = (useGitGlob) ? globWithGit : glob 

  const pathsPromise = globs.map((str) => {
    // console.log('str', str)
    // Glob pattern examples https://github.com/terkelg/globrex/blob/master/test/index.js
    // return globWithGit(str, {
    // const g = str.replace(/^(?:\.\.\/)+/, "")
    // console.log('g', g)
    return globFn(str, {
      absolute: true,
      alwaysReturnUnixPaths: true,
      ignoreGlobs: ['**/node_modules/**'],
    })
  })

  let files = []
  try {
    files = (await Promise.all(pathsPromise)).flat().filter(onlyUnique)
    opts.files = files
  } catch (e) {
    console.log(e.message)
    throw new Error(e)
  }

  // console.log('globs', globs)
  // const filex = await globby(globs)
  // console.log('filex', filex)

  /*
  const relativeFilePaths = files.map((file) => file.replace(cwd, '').replace(/^\//, ''))
  console.log('relativeFilePaths', relativeFilePaths)
  process.exit(1)
  /** */

  if (dryRun || debug) {
    info(`${files.length} Files found:`)
    console.log(files)
    /*
    process.exit(1)
    /** */
  }

  const processedFiles = files.map((file) => {
    // console.log('file', file)
    let newPath = file
    if (outputDir) {
      newPath = (outputFlatten) ? resolveFlatPath(cwd, outputDir, file)  : resolveOutputPath(cwd, outputDir, file) 
    }
    return processFile({
      ...opts,
      srcPath: file,
      outputPath: newPath,
      transforms: useTransforms
    })
  })

  const plan = (await Promise.all(processedFiles)).filter((file) => {
    /* Filter out files without transforms */
    return file.transforms.length
  })

  if (dryRun || debug) {
    /* Generate output paths */
    const outputPaths = plan.map((item) => item.outputPath)
    info(`Output files:`)
    console.log(outputPaths)
    /*
    process.exit(1)
    /** */
  }
  /*
  console.log('plan')
  deepLog(plan)
  process.exit(1)
  /** */

  const missing = plan.filter((item) => {
    return item.missingTransforms.length
  })

  let errors = []
  if (missing.length) {
    errors = missing.map((item, i) => {
      const errorMessage = `Missing ${item.missingTransforms.length} transforms in ${item.srcPath}`
      const issues = item.missingTransforms.map((trn) => {
        // console.log('trn', trn)
        // const rowData = getRowAndColumnFromCharPos(item.updatedContents, trn.open.start)
        const location = `${item.srcPath}:${trn.block.lines[0]}:0`
        const message = `Transform "${trn.transform}" at line ${trn.block.lines[0]} does not exist. → ${location}`
        return {
          message,
          location
        }
      })
      return {
        errorMessage,
        errors: issues
      }
    })
  }

  /* If transform errors and should throw, exit early */
  if (errors.length && failOnMissingTransforms) {
    throw new Error(logErrors(errors))
  }
  
  /* Log out execution plan */
  let planTotal = 0
  let missingTotal = 0
  const planOutput = plan.map((item, i) => {
    const transformsToRun = item.transforms.filter((item) => {
      if (item.context.isMissing) {
        // console.log('item', item)
        missingTotal = missingTotal + 1
      }
      return !item.context.isMissing
    })
    if (!transformsToRun.length) {
      return
    }
    const count = `${i  + 1}.`
    let planMsg = `${count} Found ${transformsToRun.length} transforms in ${item.srcPath}`
    planTotal = planTotal + transformsToRun.length
    // console.log(`Found ${transformsToRun.length} transforms in ${item.srcPath}`)
    transformsToRun.forEach((trn) => {
      const line = trn.block.lines[0]
      const location = getCodeLocation(item.srcPath, line)
      const planData = ` - "${trn.transform}" at line ${line} → ${location}`
      planMsg += `\n${planData}`
      // console.log(` - "${trn.transform}" at line ${trn.block.lines[0]}`)
    })
    const newLine = plan.length !== i + 1 ? '\n' : ''
    return `${planMsg}${newLine}`
  }).filter(Boolean)

  if (files.length) {
    console.log(LINE)
    info(`Markdown Magic updates`, '')
    const total = planTotal + missingTotal
    console.log(`Parsed files:          ${files.length}`)
    console.log(`Block Open:            ${open}`)
    console.log(`Block Close:           ${close}`)
    console.log(`Files w/ transforms:   ${plan.length} / ${files.length}`)
    console.log(`Total transforms:      ${total}`)
    console.log(`Valid transforms:      ${planTotal} / ${total}`)
    console.log(`Invalid transforms:    ${missingTotal} / ${total}`)
    console.log('Syntax:')
    logCommentBlockSyntax({
      syntax: opts.syntax || 'md',
      open,
      close
    })
    console.log(LINE)
    console.log(planOutput.join('\n'))
  }

  /* Execute updates based on plan */
  if (!dryRun) {
    const changed = plan.filter(({ isChanged }) => isChanged)
    if (changed.length) {
      console.log(LINE)
      const execute = changed.map(({ srcPath, outputPath, updatedContents, originalContents }, i) => {
        // console.log('srcPath', srcPath)
        // const newPath = path.resolve(srcPath.replace('/md/', '/output/'))
        // console.log(`${i + 1}. newPath`, newPath)
        console.log(`Update file ${outputPath}`)
        return writeFile(outputPath, updatedContents)
      })
  
      await Promise.all(execute)
    } else {
      console.log(LINE)
      console.log('No changes. Skipping file writes')
    }
  }
  /*
  TODO:
    - Output to new file
    - Clean up default transforms
    - Expose md utils
  */
  if (errors.length) {
    logErrors(errors)
  }

  console.log(LINE)
  success(`Markdown Magic Done`)
  console.log(`${LINE}\n`)

  return {
    errors,
    changes: plan,
    data: plan
  }
}

async function processFile(opts = {}) {
  const { content, syntax } = opts
  let srcPath = opts.srcPath
  if (srcPath && content) throw new Error(`Can't set both "srcPath" & "content"`)
  let fileContents
  if (content) {
    const isFile = isValidFile(content)
    srcPath = (isFile) ? content : undefined
    fileContents = (!isFile) ? content : undefined
  }

  if (!fileContents) {
    fileContents = await fs.readFile(srcPath || content, 'utf8')
  }
  
  let syntaxType = syntax
  if (srcPath && !syntaxType) {
    syntaxType = path.extname(srcPath).replace(/^\./, '')
  }
  return processContents(fileContents, {
    ...opts,
    srcPath,
    syntax: syntaxType,
  })
}

function getCodeLocation(srcPath, line, column = '0') {
  return `${srcPath}:${line}:${column}`
}

function simpleApi(stuff, opts) {
  const { transforms, srcPath, outputPath, ...rest } = opts
  return {
    srcPath: stuff.srcPath,
    outputPath: outputPath,
    transform: stuff.transform,
    options: stuff.options || {},
    blockContent: stuff.content.value,
    fileContent: stuff.currentContents,
    originalFileContent: stuff.originalContents,
    settings: {
      ...rest,
      regex: stuff.regex,
    },
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
 * Pull comment blocks out of content and process them
 * @param {string} content 
 * @param {object} config 
 * @returns 
 */
async function processContents(content, config = {}) {
  const fileContents = content
  const {
    srcPath,
    outputPath,
    open = OPEN_WORD, // 'DOCS:START',
    close = CLOSE_WORD, // 'DOCS:END',
    syntax = 'md',
    transforms,
    beforeMiddelwares = [],
    afterMiddelwares = [],
    debug = false,
  } = config

  let foundBlocks = {}
  try {
    foundBlocks = parseBlocks(fileContents, {
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

  const blocksWithTransforms = foundBlocks.blocks
    .filter((block) => block.type)
    .map((block, i) => {
      const transform = block.type
      delete block.type
      return Object.assign({ transform }, block)
    })

  const regexInfo = {
    blocks: foundBlocks.pattern,
    open: foundBlocks.commentOpen,
    close: foundBlocks.commentClose,
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
  const updatedContents = await transformsToRun.reduce(async (contentPromise, ogmatch) => {
    const md = await contentPromise
    /* Apply Before middleware to all transforms */
    const match = await applyMiddleware(ogmatch, md, beforeMiddelwares)
    const { block, content, open, close, transform, options } = match
    const closeTag = close.value
    const openTag = open.value
    
    /* Run transform plugins */
    let tempContent = content.value
    if (transforms[transform]) {
      // console.log('context', context)
      let returnedContent
      /* DISABLED legacy syntax */
      // if (context && context.isLegacy) {
      //   console.log('CALL legacy', srcPath)
      //   // backward compat maybe
      //   // CODE(content, options, config)
      //   returnedContent = await transforms[transform](content.value, options, { 
      //     originalPath: srcPath
      //   })
      // } else {
      //   // new syntax
      //   returnedContent = await transforms[transform]({
      //     srcPath,
      //     ...match,
      //     currentContents: md,
      //   })
      // }

      /* Run each transform */
      // console.log('config', config)
      returnedContent = await transforms[transform](simpleApi({
        srcPath,
        ...match,
        regex: regexInfo,
        originalContents: fileContents,
        currentContents: md,
      }, config))
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
    }, md, afterMiddelwares)
    if (debug) {
      console.log('afterContent', afterContent)
    }

    if (!transforms[transform]) {
      missingTransforms.push(afterContent)
      // console.log(`Missing "${transform}" transform`)
    }

    const newContent = afterContent.content.value
    const formattedNewContent = (options.noTrim) ? newContent : trimString(newContent)
    // console.log('formattedNewContent', formattedNewContent)
    /* Remove any conflicting imported comments */
    const fix = removeConflictingComments(formattedNewContent, foundBlocks.commentOpen, foundBlocks.commentClose)
    // const fix = stripAllComments(formattedNewContent, foundBlocks.commentOpen, foundBlocks.commentClose)

    // console.log('foundBlocks.commentClose', foundBlocks.commentClose)
    // console.log('formattedNewContent', formattedNewContent)
    // console.log('fix', fix)
    const preserveIndent = (true || options.preserveIndent) ? block.indentation.length + match.content.indentation : block.indentation.length
    const indent = indentString(fix, preserveIndent)
    const newCont = `${openTag}${indent}${closeTag}`
    /* Replace original contents */
    const newContents = md.replace(block.value, newCont)
    return Promise.resolve(newContents)
  }, Promise.resolve(content))

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
    isChanged: content !== updatedContents,
    isNewPath: srcPath !== outputPath,
    srcPath,
    outputPath,
    // config,
    transforms: transformsToRun,
    missingTransforms,
    originalContents: content,
    updatedContents
  }

  // console.log('result')
  // deepLog(result)

  return result
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

function pluralize(thing, single = '', plural = '') {
  const count = Array.isArray(thing) ? thing.length : Number(thing)
  return count === 1 ? single : plural
}

function logErrors(allErrors) {
  const word = pluralize(allErrors, 'error', 'errors')
  const title = `Markdown Magic ${word}: ${allErrors.length}`
  console.log('\n──────────────────────────────')
  error(title)
  console.log('──────────────────────────────\n')
  let msg = title
  allErrors.forEach(({ errorMessage, errors }, i) => {
    const finalMessage = `${i + 1}. ${errorMessage}`
    msg += `\n${finalMessage}`
    error(finalMessage, ``)
    errors.forEach(({ message }, n) => {
      const newLineX = errors.length !== n + 1 ? '' : '\n'
      const lineMessage = ` - ${message}`
      msg += `\n${lineMessage}`
      console.log(`${lineMessage}${newLineX}`)
    })
  })
  return msg
}

function logCommentBlockSyntax({
  syntax,
  open,
  close
}) {
  const syntaxDetails = getSyntaxInfo(syntax)
  console.log(`
${syntaxDetails.tags[0]} ${open} transformName ${syntaxDetails.tags[1]}
generated content here
${syntaxDetails.tags[0]} ${close} ${syntaxDetails.tags[1]}
`)
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
 
function sortTranforms(foundTransForms, registeredTransforms) {
  // console.log('transforms', transforms)
  if (!foundTransForms) return []
  return foundTransForms.sort((a, b) => {
    // put table of contents (TOC) at end of tranforms
    if (a.transform === 'TOC') return 1
    if (b.transform === 'TOC') return -1
    return 0
  }).map((item) => {
    if (registeredTransforms[item.transform]) {
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
  markdownMagic,
  processContents,
  processFile
}