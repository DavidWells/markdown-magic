const path = require('path')
const fs = require('fs').promises
const { glob, globWithGit } = require('smart-glob')
const isValidFile = require('is-valid-path')
const { deepLog, success, error } = require('./utils/logs')
const codeTransform = require('./transforms/code')
const fileTransform = require('./transforms/file')
const tocTransform = require('./transforms/toc')
const wordCountTransform = require('./transforms/wordCount')
const remoteTransform = require('./transforms/remote')

const { indentString, getRowAndColumnFromCharPos, getTextBetweenChars } = require('./utils/text')
const { parseBlocks } = require('./utils/block-parser')
const diff = require('../old-test/utils/diff')
const globby = require('globby')
const cwd = process.cwd()

const defaultTransforms = {
  CODE: codeTransform,
  FILE: fileTransform,
  TOC: tocTransform,
  wordCount: wordCountTransform,
  remote: remoteTransform
}

const GLOB = '**/**.md'

async function markdownMagic(opts = {}) {
  const { transforms, outputDir, dryRun = true, useGitGlob, failOnMissingTransforms = false } = opts
  console.log('outputDir', outputDir)

  const globPattern = opts.glob
  const useTransforms = Object.assign({}, defaultTransforms, transforms)
  let globs = []
  if (!globPattern) {
    globs = [ GLOB ]
  } else if (Array.isArray(globPattern)) {
    globs = globPattern
  } else if (typeof globPattern === 'string') {
    globs = [ globPattern ]
  }

  if (dryRun) {
    console.log(`ℹ Glob pattern:`)
    console.log(globs)
    console.log()
    // process.exit(1)
  }

  const globFn = (useGitGlob) ? globWithGit : glob 

  const pathsPromise = globs.map((str) => {
    // console.log('str', str)
    // Glob pattern examples https://github.com/terkelg/globrex/blob/master/test/index.js
    // return globWithGit(str, {
    return globFn(str, {
      absolute: true,
      alwaysReturnUnixPaths: true,
      ignoreGlobs: ['**/node_modules/**'],
    })
  })

  let files = []
  try {
     files = (await Promise.all(pathsPromise)).flat().filter(onlyUnique)
  } catch (e) {
    console.log(e.message)
    throw new Error(e)
  }

  // console.log('globs', globs)
  // const filex = await globby(globs)
  // console.log('filex', filex)
  const relativeFilePaths = files.map((file) => file.replace(cwd, '').replace(/^\//, ''))

  if (dryRun) {
    console.log(`ℹ Files found:`)
    console.log(files)
    // process.exit(1)
  }

  const processedFiles = files.map((file) => {
    // console.log(file)
    return processMd({
      ...opts,
      file: file,
      transforms: useTransforms
    })
  })

  const plan = (await Promise.all(processedFiles))
    /* Filter out files without transforms */
    .filter((file) => {
      return file.transforms.length
    })
  // console.log('plan')
  // deepLog(plan)
  
  const missing = plan.filter((item) => {
    return item.missingTransforms.length
  })

  let errors = []
  if (missing.length) {
    errors = missing.map((item, i) => {
      const errorMessage = `Missing ${item.missingTransforms.length} transforms in ${item.filePath}`
      const issues = item.missingTransforms.map((trn) => {
        // console.log('trn', trn)
        // const rowData = getRowAndColumnFromCharPos(item.updatedContents, trn.open.start)
        const location = `${item.filePath}:${trn.block.lines[0]}:0`
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

  if (errors.length && failOnMissingTransforms) {
    throw new Error(['\nDoc Gen Errors\n'].concat(errors.join('\n')))
  }
  
  /* Log out execution plan */
  let planTotal = 0
  const planOutput = plan.map((item, i) => {
    const transformsToRun = item.transforms.filter((item) => {
      return !item.context.isMissing
    })
    if (!transformsToRun.length) {
      return
    }
    let planMsg = `Found ${transformsToRun.length} transforms in ${item.filePath}`
    planTotal = planTotal + transformsToRun.length
    // console.log(`Found ${transformsToRun.length} transforms in ${item.filePath}`)
    transformsToRun.forEach((trn) => {
      const planData = ` - "${trn.transform}" at line ${trn.block.lines[0]} → ${item.filePath}:${trn.block.lines[0]}:0`
      planMsg += `\n${planData}`
      // console.log(` - "${trn.transform}" at line ${trn.block.lines[0]}`)
    })
    const newLine = plan.length !== i + 1 ? '\n' : ''
    return `${planMsg}${newLine}`
  }).filter(Boolean)

  console.log('──────────────────────────────')
  console.log(`Markdown Magic updates: ${planTotal}`)
  console.log('──────────────────────────────')
  console.log(planOutput.join('\n'))

  /* Execute updates */
  if (true || !dryRun) {
    const execute = plan.map(({ filePath, updatedContents, originalContents }) => {
      console.log('filePath', filePath)
      const newPath = path.resolve(filePath.replace('/md/', '/output/'))
      console.log('newPath', newPath)
      return fs.writeFile(newPath, updatedContents)
    })

    await Promise.all(execute)
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

  console.log('\n──────────────────────────────')
  success(`Markdown Magic Done`)
  console.log('──────────────────────────────\n')

  return {
    errors,
    data: plan
  }
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function logErrors(allErrors) {
  const word = allErrors.length === 1 ? 'error' : 'errors'
  console.log('\n──────────────────────────────')
  error(`Markdown Magic ${word}: ${allErrors.length}`)
  console.log('──────────────────────────────\n')
  allErrors.forEach(({ errorMessage, errors }, i) => {
    error(errorMessage, `${i + 1}. `)
    const newLine = allErrors.length !== i + 1 ? '\n' : ''
    errors.forEach(({ message }) => {
      console.log(` - ${message}${newLine}`)
    })
  })
}

async function processMd(opts = {}) {
  const { content, file, syntax } = opts
  if (file && content) throw new Error('Cant set both "file" & "content"')
  let filePath = file
  let fileContents
  if (content) {
    const isFile = isValidFile(content)
    filePath = (isFile) ? content : undefined
    fileContents = (!isFile) ? content : undefined
  }

  if (!fileContents) {
    fileContents = await fs.readFile(file || content, 'utf8')
  }
  
  let syntaxType = syntax
  if (filePath && !syntaxType) {
    syntaxType = path.extname(filePath).replace(/^\./, '')
  }
  return processContents({
    ...opts,
    filePath,
    syntax: syntaxType,
    content: fileContents
  })
}

async function processContents(config) {
  const {
    content,
    filePath,
    open = 'DOCS:START',
    close = 'DOCS:END',
    syntax = 'md',
    transforms,
    beforeMiddelwares = [],
    afterMiddelwares = [],
    DEBUG = false,
    debug = false,
  } = config

  const foundBlocks = parseBlocks(content, {
    syntax,
    open,
    close,
  })

  if (debug) {
    console.log('foundBlocks')
    deepLog(foundBlocks)
  }
  // deepLog(foundBlocks)
  // process.exit(1)

  const blocksWithTransforms = foundBlocks.blocks
    .filter((block) => block.type)
    .map((block) => {
      return Object.assign({ transform: block.type }, block)
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
  //     filePath
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
      //   console.log('CALL legacy', filePath)
      //   // backward compat maybe
      //   // CODE(content, options, config)
      //   returnedContent = await transforms[transform](content.value, options, { 
      //     originalPath: filePath
      //   })
      // } else {
      //   // new syntax
      //   returnedContent = await transforms[transform]({
      //     filePath,
      //     ...match,
      //     currentContents: md,
      //   })
      // }

      /* Run each transform */
      returnedContent = await transforms[transform]({
        filePath,
        ...match,
        regex: regexInfo,
        originalContents: config.content,
        currentContents: md,
      })
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
    if (DEBUG) {
      console.log('afterContent', afterContent)
    }

    if (!transforms[transform]) {
      missingTransforms.push(afterContent)
      // console.log(`Missing "${transform}" transform`)
    }

    const newContent = afterContent.content.value
    const formattedNewContent = (options.noTrim) ? newContent : smartTrim(newContent)
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
    // console.log('original text between', `"${getTextBetweenChars(md, contentStart, contentEnd)}"`)
    // console.log('original block between', `"${getTextBetweenChars(md, start, end)}"`)
  }
  /** */

  const result = {
    /* Has markdown content changed? */
    isChanged: content !== updatedContents,
    filePath,
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

/**
 * Trim leading & trailing spaces/line breaks in code and keeps the indentation of the first non-empty line
 * @param {string} str 
 * @returns string
 */
function smartTrim(str = '') {
  let content = str
  if (typeof str === 'number') {
    content = str.toString()
  }
  // console.log('content', `"${content}"`)
  return content.replace(/^(?:[\t ]*(?:\r?\n|\r))+|\s+$/g, '')
}

// @TODO export as util to import into CODE
function stripAllComments(block) {
  // ([^\s]*)?([ \t]*)?(\/\*{1,}[\n\*]*(\s?[\s\S]*?)?\*\/)([^\s<]*)?(\n{1,2})?
  // https://regex101.com/r/WSioZ7/1
  const pattern = new RegExp(`([^\\s]*)?([ \\t]*)?(<!-{2,}(\\s?[\\s\\S]*?)?-{2,}>)([^\\s<]*)?(\n{1,2})?`, 'gi')
  // ALT https://regex101.com/r/hxppia/1
  // Alt HTML comments https://regex101.com/r/EJyioz/1

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
  processMd
}