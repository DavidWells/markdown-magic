const path = require('path')
// @TODO remove this once we have swapped out node-fetch@2.7
const moduleAlias = require('module-alias') // "Fix" for puncode dep warning in node 22+
moduleAlias.addAlias('punycode', 'punycode/') // "Fix" for puncode dep warning in node 22+
const { glob, globWithGit } = require('smart-glob')
const codeTransform = require('./transforms/code')
const fileTransform = require('./transforms/file')
const tocTransform = require('./transforms/toc')
const sectionTocTransform = require('./transforms/sectionToc')
const wordCountTransform = require('./transforms/wordCount')
const remoteTransform = require('./transforms/remote')
const installTransform = require('./transforms/install')
const { getSyntaxInfo } = require('./utils/syntax')
const { onlyUnique, getCodeLocation, pluralize } = require('./utils')
const { readFile, resolveOutputPath, resolveFlatPath } = require('./utils/fs')
const stringBreak = require('./utils/string-break')
const { processFile } = require('./process-file')
const { processContents } = require('./process-contents')
const { parseMarkdown } = require('@davidwells/md-utils')
const { success, error, info, convertHrtime, deepLog } = require('./utils/logs')
const { OPEN_WORD, CLOSE_WORD, DEFAULT_GLOB_PATTERN } = require('./defaults')
const { getBlockRegex, parseBlocks } = require('./block-parser')
const toposort = require('./utils/toposort')
// const { hashFile } = require('./utils/hash-file')
// const { getBlockRegex } = require('./block-parser')
// const diff = require('../misc/old-test/utils/diff')

// old https://raw.githubusercontent.com/DavidWells/markdown-magic/add-package-scripts-plugin/index.js

const LINE = '──────────────────────────────────────────────────────────'

const defaultTransforms = {
  CODE: codeTransform,
  FILE: fileTransform,
  TOC: tocTransform,
  sectionToc: sectionTocTransform,
  wordCount: wordCountTransform,
  remote: remoteTransform,
  install: installTransform,
}

const defaultOptions = {
  failOnMissingTransforms: false,
  failOnMissingRemote: true,
}

/**!
 * Allowed file syntaxes
 * @typedef {'md' | 'js' | 'yml' | 'yaml'} SyntaxType
 */

/**!
 * Path to file, files or Glob string or Glob Array
 * @typedef {string|Array<string>} FilePathsOrGlobs
 */

/**
 * Configuration for markdown magic
 * 
 * Below is the main config for `markdown-magic`
 * 
 * @typedef {object} MarkdownMagicOptions
 * @property {FilePathsOrGlobs} [files] - Files to process.
 * @property {Array} [transforms = defaultTransforms] - Custom commands to transform block contents, see transforms & custom transforms sections below.
 * @property {OutputConfig} [output] - Output configuration
 * @property {SyntaxType} [syntax = 'md'] - Syntax to parse
 * @property {string} [open = 'doc-gen'] - Opening match word
 * @property {string} [close = 'end-doc-gen'] - Closing match word. If not defined will be same as opening word.
 * @property {string} [cwd = process.cwd() ] - Current working directory. Default process.cwd()
 * @property {boolean} [outputFlatten] - Flatten files that are output
 * @property {boolean} [useGitGlob] - Use git glob for LARGE file directories
 * @property {boolean} [dryRun = false] - See planned execution of matched blocks
 * @property {boolean} [debug = false] - See debug details
 * @property {boolean} [silent = false] - Silence all console output
 * @property {boolean} [applyTransformsToSource = true] - Apply transforms to source file. Default is true.
 * @property {boolean} [failOnMissingTransforms = false] - Fail if transform functions are missing. Default skip blocks.
 * @property {boolean} [failOnMissingRemote = true] - Fail if remote file is missing.
 */

/**
 * Optional output configuration
 * @typedef  {object}   OutputConfig
 * @property {string}   [directory] - Change output path of new content. Default behavior is replacing the original file
 * @property {boolean}  [removeComments = false] - Remove comments from output. Default is false.
 * @property {function} [pathFormatter] - Custom function for altering output paths
 * @property {boolean}  [applyTransformsToSource = false] - Apply transforms to source file. Default is true. This is for when outputDir is set.
 */

/**
 * Result of markdown processing
 * 
 * @typedef {object} MarkdownMagicResult
 * @property {Array} errors - Any errors encountered.
 * @property {Array<string>} filesChanged - Modified files
 * @property {Array} results - md data
 */

/**
 * ### API
 * 
 * Markdown Magic Instance
 * 
 * ```js
 * markdownMagic(globOrOpts, options)
 * ```
 * 
 * @param {FilePathsOrGlobs|MarkdownMagicOptions} globOrOpts - Files to process or config.
 * @param {MarkdownMagicOptions} [options] - Markdown magic config
 * @returns {Promise<MarkdownMagicResult>}
 * @example
  markdownMagic(['**.**.md'], options).then((result) => {
    console.log(`Processing complete`, result)
  })
 */
async function markdownMagic(globOrOpts = {}, options = {}) {
  const hrstart = process.hrtime.bigint()
  let opts = options || {}
  let globPat
  if (typeof globOrOpts === 'string' || Array.isArray(globOrOpts)) {
    opts = options
    globPat = globOrOpts
  } else if (typeof globOrOpts === 'object') {
    opts = globOrOpts
  }

  opts = Object.assign({}, defaultOptions, opts)

  const {
    transforms,
    // open,
    /** lol @type {OutputConfig} */
    output = {},
    outputFlatten = false,
    useGitGlob = false, 
    failOnMissingTransforms = false,
    failOnMissingRemote = true,
    dryRun = false,
    debug = false,
    syntax = 'md',
    silent = false,
  } = opts

  // @ts-ignore 
  const outputDir = output.directory || opts.outputDir
  const removeComments = output.removeComments || false
  const pathFormatter = output.pathFormatter
  
  let applyTransformsToSource = true
  if (typeof output.applyTransformsToSource !== 'undefined') {
    applyTransformsToSource = output.applyTransformsToSource
    // @ts-ignore
  } else if (typeof opts.applyTransformsToSource !== 'undefined') {
    // @ts-ignore
    applyTransformsToSource = opts.applyTransformsToSource
  }

  opts.applyTransformsToSource = applyTransformsToSource

  const logger = (silent) ? () => {} : console.log

  let open = OPEN_WORD
  if (opts.open) {
    open = opts.open
    // @ts-ignore legacy
  } else if (opts.matchWord) {
    // @ts-ignore legacy      
    open = `${opts.matchWord}:start`
  }

  let close = CLOSE_WORD
  if (opts.close) {
    close = opts.close
    // @ts-ignore legacy
  } else if (opts.matchWord) {
    // @ts-ignore legacy
    close = `${opts.matchWord}:end`
  }
  
  const cwd = opts.cwd || process.cwd()
  
  // @ts-ignore
  const globPattern = globPat || globOrOpts.files || globOrOpts.file || globOrOpts.glob
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

  /* Trim globs inputs */
  globs = globs
    .filter((pat) => Boolean(pat))
    .map((pat) => pat.trim())

  // Opts passed into plugins
  // @ts-ignore
  opts.globPattern = globs

  logger(LINE)
  success(` Markdown Magic Starting...`, silent, '✨ ')
  logger(`${LINE}\n`)

  info(`Searching for comment blocks...`, silent, '🔎 ')
  logger(`\nSyntax:        ${syntax}`)
  logger(`Block Open:    ${open}`)
  logger(`Block Close:   ${close}`)
  logger(`Searching:    `, globs)

  if (dryRun || debug) {
    info(`Glob patterns:`, silent)
    logger(globs)
    logger()
    /*
    process.exit(1)
    /** */
  }

  const globFn = (useGitGlob) ? globWithGit : glob 

  const pathsPromise = globs.map((str) => {
    // logger('str', str)
    // Glob pattern examples https://github.com/terkelg/globrex/blob/master/test/index.js
    // return globWithGit(str, {
    // const g = str.replace(/^(?:\.\.\/)+/, "")
    // logger('g', g)
    return globFn(str, {
      absolute: true,
      alwaysReturnUnixPaths: true,
      ignoreGlobs: ['**/node_modules/**'],
    })
  })

  if (debug) {
    // info(`pathsPromise:`)
    // logger(pathsPromise)
    // logger()
    /*
    process.exit(1)
    /** */
  }

  let files = []
  try {
    files = (await Promise.all(pathsPromise)).flat().filter(onlyUnique)
    // opts.files = files
  } catch (e) {
    // console.log(e.message)
    throw new Error(e)
  }


  // logger('files', files)
  // return
  // logger('globs', globs)
  // const filex = await globby(globs)
  // logger('filex', filex)

  /*
  const relativeFilePaths = files.map((file) => file.replace(cwd, '').replace(/^\//, ''))
  logger('relativeFilePaths', relativeFilePaths)
  process.exit(1)
  /** */

  if (debug) {
    info(`files:`)
    logger(files)
    logger()
    /*
    process.exit(1)
    /** */
  }
  


  const patterns = getBlockRegex({
    syntax,
    openText: open,
    closeText: close
  })

  if (debug) {
    console.log(`patterns:`, patterns)
  }


  const fileContents = await Promise.all(files.map((file) => readFile(file, 'utf8')))

  const blocksByPath = files.map((file, i) => {
    const text = fileContents[i]
    let foundBlocks = {}
    try {
      
      // console.log('try, file', file)
      foundBlocks = parseBlocks(text, {
        syntax,
        open,
        close,
      })
      // console.log('foundBlocks', foundBlocks.blocks.length)
    } catch (e) {
      throw new Error(`${e.message}\nFix content in ${file}\n`)
    }
    return {
      name: file,
      id: file,
      srcPath: file,
      blocks: foundBlocks.blocks
    }
  })

  const blocks = blocksByPath.map((item) => {
    const dir = path.dirname(item.srcPath)
    item.dependencies = []
    item.blocks.forEach((block) => {
      if (block.options && block.options.src) {
        const resolvedPath = path.resolve(dir, block.options.src)
        // if (resolvedPath.match(/\.md$/)) {
          // console.log('resolvedPath', resolvedPath)
          item.dependencies = item.dependencies.concat(resolvedPath)
        //}
      }
    })
    return item
  })


  // logger(blocks[0].blocks)


  if (debug) {
    info(`Found blocks:`)
    logger(blocks)
    logger()
    /*
    process.exit(1)
    /** */
  }
  /*
  console.log('blocks')
  deepLog(blocks)
  /** */

  // Convert items into a format suitable for toposort
  const graph = blocks
    .filter((item) => item.blocks && item.blocks.length)
    .map((item) => {
      return [ item.id, ...item.dependencies ]
    })
  // console.log('graph', graph)
  // Perform the topological sort and reverse for execution order
  const sortedIds = toposort(graph).reverse();

  // Reorder items based on sorted ids
  const sortedItems = sortedIds.map(id => blocks.find(item => item.id === id)).filter(Boolean);

  // topoSort(blocks)
  const orderedFiles = sortedItems.map((item) => item.id)
  // console.log('sortedItems', sortedItems)
  // console.log('orderedFiles', orderedFiles)

  const processedFiles = []
  await asyncForEach(orderedFiles, async (file) => {
    // logger('file', file)
    let newPath = path.resolve(cwd, file)
    /* Allow for different output directory */
    if (outputDir) {
      newPath = (outputFlatten) ? resolveFlatPath(cwd, outputDir, file) : resolveOutputPath(cwd, outputDir, file) 
    }
    /* Allow for custom handling of individual files */
    if (pathFormatter) {
      newPath = pathFormatter({ filePath: newPath })
    }
    // console.log('newPath', newPath)
    // const cleanerDirPath = path.dirname(file)
    // const baseDir = cleanerDirPath.replace(cwd, '')
    // const cleanerDir = baseDir
    // const resolvedDir = path.join(cleanerDir, outputDir)
    // const cleanFinalPath = path.resolve(resolvedDir, path.basename(file))
    /*
    logger('cleanerDir', cleanerDir)
    logger('resolvedDir', resolvedDir)
    logger('cleanFinalPath', cleanFinalPath)
    /** */
    // logger('newPath', newPath)
    const result = await processFile({
      ...opts,
      patterns,
      open,
      close,
      srcPath: file,
      outputPath: newPath,
      transforms: useTransforms,
      removeComments,
      processedFiles
    })

    processedFiles.push(result)
  })

  /* @TODO

    Blocks are already parsed, pass them into processFile to avoid reparse
  */
  // const processedFiles = orderedFiles.map(async (file) => {
  //   // logger('file', file)
  //   let newPath = path.resolve(cwd, file)
  //   /* Allow for different output directory */
  //   if (outputDir) {
  //     newPath = (outputFlatten) ? resolveFlatPath(cwd, outputDir, file) : resolveOutputPath(cwd, outputDir, file) 
  //   }
  //   /* Allow for custom handling of individual files */
  //   if (pathFormatter) {
  //     newPath = pathFormatter({ filePath: newPath })
  //   }
  //   // const cleanerDirPath = path.dirname(file)
  //   // const baseDir = cleanerDirPath.replace(cwd, '')
  //   // const cleanerDir = baseDir
  //   // const resolvedDir = path.join(cleanerDir, outputDir)
  //   // const cleanFinalPath = path.resolve(resolvedDir, path.basename(file))
  //   /*
  //   logger('cleanerDir', cleanerDir)
  //   logger('resolvedDir', resolvedDir)
  //   logger('cleanFinalPath', cleanFinalPath)
  //   /** */
  //   // logger('newPath', newPath)
  //   const result = await processFile({
  //     ...opts,
  //     open,
  //     close,
  //     srcPath: file,
  //     outputPath: newPath,
  //     transforms: useTransforms,
  //     removeComments,
  //   })

  //   return result
  // })

  /*
  console.log('processedFiles', processedFiles)
  // process.exit(1)
  /** */

  const plan = (await Promise.all(processedFiles)).filter((file) => {
    /* Filter out files without transforms */
    return file.transforms.length
  })

  /*
  process.exit(1)
  /** */
  
  if (debug) {
    logger()
    logger(`Pattern open:`)
    logger(patterns.openPattern)
    logger(`Pattern close:`)
    logger(patterns.closePattern)
  }

  logger()
  info(` Available Transforms:`, silent, '🔁 ') 
  logger(`\n${Object.keys(useTransforms).join(', ')}\n`)
  info(` Syntax example:`, silent, '🧱 ') 
  logger()
  logCommentBlockSyntax({
    syntax: syntax,
    open,
    close,
    logger
  })

  /*
  logger('plan')
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
        // logger('trn', trn)
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
        // logger('item', item)
        missingTotal = missingTotal + 1
      }
      return !item.context.isMissing
    })
    if (!transformsToRun.length) {
      return
    }
    const count = `   ${i  + 1}.`
    let planMsg = `${count} Found ${transformsToRun.length} transforms in ${item.srcPath}`
    planTotal = planTotal + transformsToRun.length
    // logger(`Found ${transformsToRun.length} transforms in ${item.srcPath}`)
    transformsToRun.forEach((trn) => {
      const line = trn.block.lines[0]
      const location = getCodeLocation(item.srcPath, line)
      const planData = `      - "${trn.transform}" at line ${line} → ${location}`
      planMsg += `\n${planData}`
      // logger(` - "${trn.transform}" at line ${trn.block.lines[0]}`)
    })
    const newLine = plan.length !== i + 1 ? '\n' : ''
    return `${planMsg}${newLine}`
  }).filter(Boolean)
  
  logger()
  if (!files.length) {
    info(`Results:`, silent)
    logger("No files found. Exiting early.", silent)
    return {
      errors,
      filesChanged: [],
      results: plan
    }
  } else  {
    info(` Parse results:`, silent, "🟢 ")
    const total = planTotal + missingTotal
    logger()
    logger(`Total transforms:        ${total}`)
    logger(`Files with transforms:   ${plan.length} / ${files.length}`)
    logger(`Valid transforms:        ${planTotal} / ${total}`)
    logger(`Invalid transforms:      ${missingTotal} / ${total}`)

    logger(`\nFiles scanned:           ${files.length}`)
    logger(files)

    logger(`\nFiles with transforms:   ${plan.length}`)
    if (plan.length) {
      logger(plan.map(({ srcPath }) => srcPath))
      logger()
    }
    // logger('Syntax:')
    // logCommentBlockSyntax({
    //   syntax: syntax,
    //   open,
    //   close
    // })
    // logger('\nStats:')

    if (planOutput.length) {
      info(` Execution plan:`, silent, "📑 ")
      logger()
      logger(planOutput.join('\n'))
    } else {
      info(` Execution plan:`, silent, "📑 ")
      logger('\nNo transforms to run. Exiting markdown magic early.')
      logger('If you think this is incorrect, verify your comment blocks in your src and the settings in your config.')
    }
  }

  /* Generate output paths */
  const outputPaths = plan.map((item) => item.outputPath)
  const changed = (outputDir) ? plan : changedFiles(plan)
  const label = (outputDir) ? 'Files to create or update' : 'Files to update'
  
  if (outputPaths.length && changed.length)  {
    logger()
    info(`${label}`, silent)
    logger()
    if (outputDir) {
      logger('Output directory:')
      logger(outputDir)
      logger()
    }
    logger('Output files:')
    logger(outputPaths)
    logger()
  }

  /* Execute updates based on plan */
  const alwaysUpdateOutput = true

  if (!dryRun && plan.length) {
    logger()
    info(`Apply changes:`, silent, "✏️ ")
    
    /* Check for diffs in src vs output only */
    // if (outputDir) {
    //   const compareFiles = plan.map(async (item) => {
    //     /* fast check */
    //     if (item.isChanged) {
    //       return item
    //     }
    //     /* Maybe make an option? */
    //     if (alwaysUpdateOutput) {
    //       return Object.assign({}, item, { isChanged: true })
    //     }

    //     /* else slower check hashes of destination */
    //     const outputHash = await hashFile(item.outputPath)
    //     const srcHash = await hashFile(item.srcPath)
    //     return {
    //       ...item,
    //       isChanged: outputHash !== srcHash
    //     }
    //   })
    //   /* Set new changed array */
    //   changed = (await Promise.all(compareFiles)).filter(({ isChanged }) => isChanged)
    // }
    
    if (changed.length) {
      logger()
      
      changed.forEach(({
        srcPath,
        outputPath,
        updatedContents,
        stripComments,
        originalContents,
      }, i) => {
        // logger(`${i + 1}. newPath`, newPath)
        let cleanContents = updatedContents
        if (stripComments && patterns.openPattern && patterns.closePattern) {
          cleanContents = updatedContents.replace(patterns.openPattern, '').replace(patterns.closePattern, '')
        }

        let promises = []
        if (outputDir) {
          logger(`- Update output file: ${outputPath}`)
          // promises = promises.concat(writeFile(outputPath, cleanContents))
        }
        if (!outputDir || applyTransformsToSource) {
          logger(`- Update source file: ${srcPath}`)
          // promises = promises.concat(writeFile(srcPath, updatedContents))
        }
        /* Apply file transforms to source templates */
        // return Promise.all(promises)
      })
    } else {
      logger('\nNo changes detected. Skipping file writes...')
    }
  }


  /*
  process.exit(1)
  /** */
  logger()
  info(` Results:`, silent, "💫 ")

  /*
  TODO:
    - Output to new file
    - Clean up default transforms
    - Expose md utils
  */
  if (errors.length) {
    logErrors(errors)
  }

  const elasped = convertHrtime(process.hrtime.bigint() - hrstart)

  logger()
  logger(`${LINE}`)
  success(`Markdown Magic Done. ${elasped.seconds} seconds`, silent)
  logger(`${LINE}`)
  return {
    // @TODO maybe seperate changed and output files
    filesChanged: plan.filter(({ isChanged, isNewPath }) => isChanged || isNewPath).map(({ outputPath }) => outputPath),
    results: plan,
    errors,
  }
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
      const hasNewLine = errors.length !== n - 1 ? '' : '\n'
      const lineMessage = ` - ${message}`
      msg += `\n${lineMessage}`
      console.log(`${lineMessage}${hasNewLine}`)
    })
  })
  return msg
}

function logCommentBlockSyntax({
  syntax,
  open,
  close,
  logger
}) {
  const syntaxDetails = getSyntaxInfo(syntax)
  logger(`${syntaxDetails.tags[0]} ${open} transformName option="xyz" ${syntaxDetails.tags[1]}
Contents to be replaced/updated
${syntaxDetails.tags[0]} ${close} ${syntaxDetails.tags[1]}`)
}

function changedFiles(files) {
  return files.filter(({ isChanged }) => isChanged)
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const stringUtils = {
  stringBreak
}

module.exports = {
  markdownMagic,
  parseMarkdown,
  processContents,
  processFile,
  stringUtils
}