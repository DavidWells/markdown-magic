const fs = require('fs').promises
const path = require('path')
const globrex = require('globrex')
const isGlob = require('is-glob')
const _isLocalPath = require('is-local-path')
const { REGEX_REGEX, escapeRegexString } = require('./regex') 
const { dirname, resolve, join } = require('path')
const { readdir, stat, readFile } = fs

const IS_HIDDEN_FILE = /(^|[\\\/])\.[^\\\/\.]/g

/**
 * Check if value is a RegExp
 * @param {any} thing - Value to check
 * @returns {boolean} True if value is RegExp
 */
function isRegex(thing) {
  return (thing instanceof RegExp)
}

/**
 * Write file with directory creation if needed
 * @param {string} filePath - File path to write to
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content)
  } catch(e) {
    const dirName = path.dirname(filePath)
    await fs.mkdir(dirName, { recursive: true })
    await fs.writeFile(filePath, content)
  }
}

async function findUp(start, fileName) {
  const file = await escalade(start, (dir, relativePaths) => {
    // console.log('~> dir:', dir);
    // console.log('~> relativePaths:', relativePaths);
    // console.log('---')
    if (typeof fileName === 'string' && relativePaths.includes(fileName)) {
      // will be resolved into absolute
      return fileName
    }
    if (fileName instanceof RegExp) {
      const found = relativePaths.find((relativePath) => relativePath.match(fileName))
      if (found) return found
    }
  })
  return file
}

// https://github.com/lukeed/escalade
async function escalade(start, callback) {
	let dir = resolve('.', start)
	let tmp, stats = await stat(dir)

	if (!stats.isDirectory()) {
		dir = dirname(dir)
	}

	while (true) {
		tmp = await callback(dir, await readdir(dir))
		if (tmp) return resolve(dir, tmp)
		dir = dirname(tmp = dir)
		if (tmp === dir) break;
	}
}

// alt https://github.com/duniul/clean-modules/blob/33b66bcfb7825e1fa1eb1e296e523ddba374f1ae/src/utils/filesystem.ts#L92
// Alt https://github.com/AvianFlu/ncp
// Moved to https://www.npmjs.com/package/glob-monster
// async function getFilePaths(dirName, {
//   patterns = [],
//   ignore = [],
//   excludeGitIgnore = false,
//   excludeHidden = false
// }) {

// }

/**
 * Convert absolute path to relative path
 * @param {string} file - Absolute file path
 * @param {string} cwd - Current working directory
 * @returns {string} Relative path
 */
function convertToRelativePath(file, cwd) {
  return file.replace(cwd, '').replace(/^\//, '')
}

async function getGitignoreContents(filePath = '.gitignore') {
  try {
    const gitIgnoreContent = await readFile(filePath, { encoding: 'utf8' })
    return gitIgnoreContent
      .split(/\r?\n/)
      .filter((line) => !/^\s*$/.test(line) && !/^\s*#/.test(line))
      .map((line) => line.trim().replace(/^\/+|\/+$/g, ''))
  } catch (_a) {
    return []
  }
}

// slash at the beginning of a filename
const leadingPathSeparator = new RegExp(`^${escapeRegexString(path.sep)}`)
const windowsLeadingPathSeparator = new RegExp('^/')

// all slashes in the filename. path.sep is OS agnostic (windows, mac, etc)
const pathSeparator = new RegExp(escapeRegexString(path.sep), 'g')
const windowsPathSeparator = new RegExp('/', 'g')

// handle MS Windows style double-backslashed filenames
const windowsDoubleSlashSeparator = new RegExp('\\\\', 'g')

// derive `foo.bar.baz` object key from `foo/bar/baz.yml` filename
function fileNameToKey(filename) {
  // const extension = new RegExp(`${path.extname(filename)}$`)
  const key = filename
    // .replace(extension, '')
    .replace(leadingPathSeparator, '')
    .replace(windowsLeadingPathSeparator, '')
    .replace(pathSeparator, '.')
    .replace(windowsPathSeparator, '.')
    .replace(windowsDoubleSlashSeparator, '.')

  return key
}

// https://github.com/regexhq/unc-path-regex/blob/master/index.js
function isUncPath(filepath) {
  return /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/.test(filepath)
}
function isRelative(filepath) {
  const isRel = !isUncPath(filepath) && !/^([a-z]:)?[\\\/]/i.test(filepath)
  // console.log(`isRel ${filepath}`, isRel)
  return isRel
}
/* Find common parts of 2 paths */
function resolveCommonParent(mainDir = '', fileDir = '') {
  const parts = mainDir.split('/')
  let acc = ''
  let value = ''
  for (let i = 0; i < parts.length; i++) {
    const element = parts[i];
    acc+= ((i) ? '/' : '') + element
    if (fileDir.startsWith(acc)) {
      value = acc
    }
  }
  return value
}

function resolveOutputPath(cwd, outputDir, file) {
  // console.log('file', file)
  const fileCommon = resolveCommonParent(cwd, file)
  // console.log('fileCommon', fileCommon)
  const remove = resolveCommonParent(outputDir, file)
  const fileName = file.replace(remove, '').replace(fileCommon, '')
  let outputFilePath = path.join(outputDir, fileName)
  if (isRelative(outputDir)) {
    outputFilePath = path.join(cwd, outputDir, fileName)
  }
  // console.log('isRelative(outputDir)', isRelative(outputDir))
  // console.log('outputDir', outputDir)
  // console.log('fileName', fileName)
  // console.log('remove', remove)
  return outputFilePath
}

function resolveFlatPath(cwd, outputDir, file) {
  /* old setup */
  const fileName = path.basename(file)
  let outputFilePath = path.join(outputDir, fileName)
  if (isRelative(outputDir)) {
    outputFilePath = path.join(cwd, outputDir, fileName)
  }
  return outputFilePath
}

function depth(string) {
  return path.normalize(string).split(path.sep).length - 1;
}

/**
 * Check if path is local (not remote)
 * @param {string} filePath - File path to check
 * @returns {boolean} True if path is local
 */
function isLocalPath(filePath) {
  if (filePath.startsWith('github.com/') || filePath.startsWith('raw.githubusercontent.com/')) return false
  return _isLocalPath(filePath)
}

module.exports = {
  isLocalPath,
  writeFile,
  readFile, 
  findUp,
  resolveOutputPath,
  resolveFlatPath,
  resolveCommonParent,
  getGitignoreContents,
  convertToRelativePath
}