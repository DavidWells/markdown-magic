const globrex = require('globrex')
const isGlob = require('is-glob')
const { dirname, resolve, join } = require('path')
const { readdir, stat, readFile } = require('fs')
const { promisify } = require('util')

const toStats = promisify(stat)
const readDir = promisify(readdir)
const read_file = promisify(readFile)

const IS_HIDDEN_FILE = /(^|[\\\/])\.[^\\\/\.]/g

// https://github.com/lukeed/escalade
async function escalade(start, callback) {
	let dir = resolve('.', start)
	let tmp, stats = await toStats(dir)

	if (!stats.isDirectory()) {
		dir = dirname(dir)
	}

	while (true) {
		tmp = await callback(dir, await readDir(dir))
		if (tmp) return resolve(dir, tmp)
		dir = dirname(tmp = dir)
		if (tmp === dir) break;
	}
}

async function findUp(start, fileName) {
  const file = await escalade(start, (dir, names) => {
    // console.log('~> dir:', dir);
    // console.log('~> names:', names);
    // console.log('---')
    if (typeof fileName === 'string' && names.includes(fileName)) {
      // will be resolved into absolute
      return fileName
    }
    if (fileName instanceof RegExp) {
      const found = names.find((name) => name.match(fileName))
      if (found) return found
    }
  })
  return file
}

// https://github.com/lukeed/totalist
async function totalist(dir, callback, pre='') {
	dir = resolve('.', dir)
	await readDir(dir).then(arr => {
		return Promise.all(arr.map((str) => {
      let abs = join(dir, str)
      return toStats(abs).then(stats => {
        return stats.isDirectory() ? totalist(abs, callback, join(pre, str)) : callback(join(pre, str), abs, stats)
      })
    }))
	})
}

function combineRegexes(patterns = []) {
  const string = patterns.map((reg) => reg.source).join('|')
  return new RegExp(string)
}

async function getFilePaths(dirName, {
  patterns = [],
  ignore = [],
  excludeGitIgnore = false,
  excludeHidden = false
}) {
  let findPattern
  let ignorePattern
  let filePaths = []
  let gitIgnoreFiles = []
  let gitIgnoreGlobs = []

  if (patterns && patterns.length) {
    findPattern = combineRegexes(patterns)
  }
  if (ignore && ignore.length) {
    ignorePattern = combineRegexes(ignore)
  }

  if (excludeGitIgnore) {
    const gitIgnoreContents = await getGitignoreContents()
    for (let index = 0; index < gitIgnoreContents.length; index++) {
      const ignoreItem = gitIgnoreContents[index]
      // console.log('ignoreItem', ignoreItem)
      if (isGlob(ignoreItem)) {
        gitIgnoreGlobs.push(ignoreItem)
      } else {
        gitIgnoreFiles.push(
          ignoreItem.replace(/^\.\//, '') // normalize relative paths
        )
      }
    }
  }
  
  /*
  console.log('findPattern', findPattern)
  console.log('ignorePattern', ignorePattern)
  console.log('gitIgnoreFiles', gitIgnoreFiles)
  console.log('gitIgnoreGlobs', gitIgnoreGlobs)
  // process.exit(1)
  /** */

  await totalist(dirName, (name, abs, stats) => {
    const currentPath = `${dirName}/${name}`
    const topLevelDir = name.substring(0, name.indexOf('/'))
    // console.log('currentPath', currentPath)
    // console.log('name', name)
    // console.log('topLevelDir', topLevelDir)

    /* Remove hidden files */
    if (excludeHidden && IS_HIDDEN_FILE.test(name)) {
      return
    }

    /* Remove files in git ignore */
    if (excludeGitIgnore && gitIgnoreFiles.length) {
      if (gitIgnoreFiles.includes(name)) return
      //* // slow
      if (gitIgnoreFiles.some((ignore) => {
        // console.log('ignore', ignore)
        // return name.indexOf(ignore) > -1
        // return name.split('/')[0] === ignore
        return topLevelDir === ignore || name === ignore
      })) {
        return
      }
      /** */
    }

    /* Remove files in ignore array */
    if (ignorePattern && ignorePattern.test(name)) {
      // Alt checker https://github.com/axtgr/wildcard-match
      return
    }

    /* If no patterns supplied add all files */
    if (!findPattern) {
      filePaths.push(currentPath)
      return
    }

    /* If pattern match add file! */
    if (findPattern.test(currentPath)) {
      filePaths.push(currentPath)
      return
    }
    /*
    let ignored = false
    for (let index = 0; index < ignore.length; index++) {
      const pattern = ignore[index]
      if (pattern.test(currentPath)) {
        ignored = true
      }
    }
    if (!ignored) {
      filePaths.push(currentPath)
    }
    /** */
	})

  if (gitIgnoreGlobs && gitIgnoreGlobs.length) {
    let removeFiles = []
    for (let index = 0; index < gitIgnoreGlobs.length; index++) {
      const glob = gitIgnoreGlobs[index]
      const result = globrex(glob) // alt lib https://github.com/axtgr/wildcard-match
      // console.log('result', result)
      for (let n = 0; n < filePaths.length; n++) {
        const file = filePaths[n]
        if (result.regex.test(file)) {
          removeFiles.push(file)
        }
      }
    }
    /* Remove files that match glob pattern */
    if (removeFiles.length) {
      filePaths = filePaths.filter(function(el) {
        return removeFiles.indexOf(el) < 0
      })
    }
  }

  return filePaths
}

async function getGitignoreContents(filePath = '.gitignore') {
  try {
    const gitIgnoreContent = await read_file(filePath, { encoding: 'utf8' })
    return gitIgnoreContent
      .split(/\r?\n/)
      .filter((line) => !/^\s*$/.test(line) && !/^\s*#/.test(line))
      .map((line) => line.trim().replace(/^\/+|\/+$/g, ''))
  } catch (_a) {
    return []
  }
}

module.exports = {
  findUp,
  getFilePaths,
  getGitignoreContents
}