const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { glob, globWithGit } = require('smart-glob')
const GREEN = '\x1b[32m%s\x1b[0m';
const { findUp, getGitignoreContents, convertToRelativePath } = require('./fs')

const ROOT_DIR = path.resolve(__dirname, '../../')

test('Exports API', () => {
  assert.equal(typeof findUp, 'function', 'undefined val')
})

test('Finds file from file', async () => {
  const startDir = path.resolve(__dirname, '../index.js')
  const file = await findUp(startDir, 'README.md')
  assert.ok(file)
  assert.equal(path.basename(file || ''), 'README.md')
})

test('Finds file from dir', async () => {
  const startDir = path.resolve(__dirname, '../')
  const file = await findUp(startDir, 'README.md')
  assert.ok(file)
  assert.equal(path.basename(file || ''), 'README.md')
})

test('getGitignoreContents', async () => {
  const files = await getGitignoreContents()
  /*
  console.log('files', files)
  /** */
  assert.is(Array.isArray(files), true)
  assert.equal(files, [
    'logs',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'test/fixtures/output',
    '_out.md',
    'misc',
    'misc/**/**.js',
    "__misc",
    'large-table.md',
    'large-table.js',
    'large-table-data.json',
    '**/old-test/cool.md',
    'pids',
    '*.pid',
    '*.seed',
    '*.pid.lock',
    'lib-cov',
    'coverage',
    '.nyc_output',
    '.grunt',
    'bower_components',
    '.lock-wscript',
    'build/Release',
    'node_modules',
    'jspm_packages',
    'typings',
    '.npm',
    '.eslintcache',
    '.node_repl_history',
    '*.tgz',
    '.yarn-integrity',
    '.env',
    '.env.test',
    '.cache',
    '.next',
    '.nuxt',
    '.vuepress/dist',
    '.serverless',
    '.fusebox',
    '.dynamodb',
    '.DS_Store',
    '.AppleDouble',
    '.LSOverride',
    'Icon',
    '._*',
    '.DocumentRevisions-V100',
    '.fseventsd',
    '.Spotlight-V100',
    '.TemporaryItems',
    '.Trashes',
    '.VolumeIcon.icns',
    '.com.apple.timemachine.donotpresent',
    '.AppleDB',
    '.AppleDesktop',
    'Network Trash Folder',
    'Temporary Items',
    '.apdisk'
  ])
})

async function aggregateReports() {
  console.log(GREEN, `Done.`);
}

function convertToRelative(files, dir) {
  return files.map((f) => convertToRelativePath(f, dir)).sort()
}

async function getIgnores(dir){
  const files = await getGitignoreContents()
  console.log('files', files)
}

//getIgnores(process.cwd())

test.run()