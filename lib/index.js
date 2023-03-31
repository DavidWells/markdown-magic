const path = require('path')
const { glob, globWithGit } = require('smart-glob')
const codeTransform = require('./transforms/code')
const fileTransform = require('./transforms/file')
const tocTransform = require('./transforms/toc')
const sectionTocTransform = require('./transforms/sectionToc')
const wordCountTransform = require('./transforms/wordCount')
const remoteTransform = require('./transforms/remote')
const { deepLog, success, error, info } = require('./utils/logs')
const { getSyntaxInfo } = require('./utils/syntax')
const { onlyUnique, getCodeLocation, pluralize } = require('./utils')
const { writeFile, resolveOutputPath, resolveFlatPath } = require('./utils/fs')
const { processFile } = require('./process-file')
const { processContents } = require('./process-contents')
const { getBlockRegex } = require('./block-parser')
const { OPEN_WORD, CLOSE_WORD, DEFAULT_GLOB_PATTERN } = require('./defaults')
const { parseMarkdown } = require('./utils/md/parse')

const LINE = '────────────────────────────────'
// const diff = require('../misc/old-test/utils/diff')

const defaultTransforms = {
  CODE: codeTransform,
  FILE: fileTransform,
  TOC: tocTransform,
  sectionToc: sectionTocTransform,
  wordCount: wordCountTransform,
  remote: remoteTransform
}

/**
 * Markdown Magic
 * @param {string|object} globOrOpts - Files to process or config
 * @param {*} options - Markdown magic config
 * @returns 
 */
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
    /**
     * - `transforms` - *object* - (optional) Custom commands to transform block contents, see transforms & custom transforms sections below.
     * @type {Object}
     */
    transforms,
    outputDir,
    outputFlatten = false,
    handleOutputPath,
    useGitGlob = false, 
    failOnMissingTransforms = false,
    dryRun = false,
    debug = true,
  } = opts

  let open = OPEN_WORD
  if (opts.open) {
    open = opts.open
  } else if (opts.matchWord) {
    open = `${opts.matchWord}:start`
  }

  let close = CLOSE_WORD
  if (opts.close) {
    close = opts.close
  } else if (opts.matchWord) {
    close = `${opts.matchWord}:end`
  }

  // console.log('outputDir', outputDir)
  // console.log('outputFlatten', outputFlatten)
  // return
  
  const cwd = opts.cwd || process.cwd()
  // console.log('cwd', cwd)
  const globPattern = globPat || globOrOpts.glob || globOrOpts.file || globOrOpts.files
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
  // console.log('globs', globs)
  // return

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
  } catch (/** @type {any} */e) {
    console.log(e.message)
    throw new Error(e)
  }
  // console.log('files', files)
  // return
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
    let newPath = path.resolve(cwd, file)
    /* Allow for different output directory */
    if (outputDir) {
      newPath = (outputFlatten) ? resolveFlatPath(cwd, outputDir, file) : resolveOutputPath(cwd, outputDir, file) 
    }
    /* Allow for custom handling of individual files */
    if (handleOutputPath) {
      newPath = handleOutputPath(newPath)
    }
    // const cleanerDirPath = path.dirname(file)
    // const baseDir = cleanerDirPath.replace(cwd, '')
    // const cleanerDir = baseDir
    // const resolvedDir = path.join(cleanerDir, outputDir)
    // const cleanFinalPath = path.resolve(resolvedDir, path.basename(file))
    /*
    console.log('cleanerDir', cleanerDir)
    console.log('resolvedDir', resolvedDir)
    console.log('cleanFinalPath', cleanFinalPath)
    /** */
    // console.log('newPath', newPath)
    return processFile({
      ...opts,
      open,
      close,
      srcPath: file,
      outputPath: newPath,
      transforms: useTransforms
    })
  })
  // process.exit(1)
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
      console.log()
      const execute = changed.map(({ srcPath, outputPath, updatedContents, originalContents }, i) => {
        // console.log(`${i + 1}. newPath`, newPath)
        console.log(`- Update file ${outputPath}`)
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

module.exports = {
  markdownMagic,
  parseMarkdown,
  processContents,
  processFile
}