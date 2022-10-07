const { dirname, resolve } = require('path')
const { readdir, stat } = require('fs')
const { promisify } = require('util')

const toStats = promisify(stat)
const toRead = promisify(readdir)

async function escalade(start, callback) {
	let dir = resolve('.', start)
	let tmp, stats = await toStats(dir)

	if (!stats.isDirectory()) {
		dir = dirname(dir)
	}

	while (true) {
		tmp = await callback(dir, await toRead(dir))
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

module.exports = {
  findUp
}