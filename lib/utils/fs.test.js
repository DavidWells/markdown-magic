const path = require('path')
const { test } = require('uvu') 
const assert = require('uvu/assert')
const { glob, globWithGit } = require('smart-glob')
const GREEN = '\x1b[32m%s\x1b[0m';
const { findUp, getFilePaths, getGitignoreContents, convertToRelativePath } = require('./fs')

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

test('getFilePaths /\.test\.js?$/', async () => {
  const files = await getFilePaths(ROOT_DIR, {
    patterns: [
      /\.test\.js?$/,
    ],
    ignore: [
      /node_modules/,
    ],
  })
  const foundFiles = convertToRelative(files, ROOT_DIR)
  console.log('foundFiles', foundFiles)
  assert.is(Array.isArray(files), true)
  assert.equal(foundFiles, [
    'lib/block-parser-js.test.js',
    'lib/block-parser.test.js',
    'lib/cli.test.js',
    'lib/index.test.js',
    'lib/utils/fs.test.js',
    "lib/utils/md/find-frontmatter.test.js",
    "lib/utils/md/md.test.js",
    "lib/utils/text.test.js",
    'test/errors.test.js',
    'test/transforms.test.js'
  ])
})

test('getFilePaths /\.mdx?$/, /\.test\.js?$/', async () => {
  const files = await getFilePaths(ROOT_DIR, {
    patterns: [
      /fixtures\/md\/(.*)\.mdx?$/,
      // /\.js$/,
      /\.test\.js?$/,
    ],
    ignore: [
      // /^node_modules\//,
      /node_modules/,
      // /\.git/, 
      // /NOTES\.md/
    ],
    //excludeGitIgnore: true,
    excludeHidden: true,
  })
  const foundFiles = convertToRelative(files, ROOT_DIR)
  //console.log('foundFiles', foundFiles)
  assert.is(Array.isArray(files), true)
  assert.equal(foundFiles, [
    'lib/block-parser-js.test.js',
    'lib/block-parser.test.js',
    'lib/cli.test.js',
    'lib/index.test.js',
    'lib/utils/fs.test.js',
    "lib/utils/md/find-frontmatter.test.js",
    "lib/utils/md/md.test.js",
    "lib/utils/text.test.js",
    'test/errors.test.js',
    'test/fixtures/md/basic.md',
    "test/fixtures/md/broken-inline.md",
    'test/fixtures/md/error-missing-transforms-two.md',
    'test/fixtures/md/error-missing-transforms.md',
    'test/fixtures/md/error-no-block-transform-defined.md',
    'test/fixtures/md/error-unbalanced.md',
    'test/fixtures/md/format-inline.md',
    'test/fixtures/md/format-with-wacky-indentation.md',
    'test/fixtures/md/inline-two.md',
    'test/fixtures/md/inline.md',
    'test/fixtures/md/mdx-file.mdx',
    'test/fixtures/md/missing-transform.md',
    'test/fixtures/md/mixed.md',
    'test/fixtures/md/nested/nested.md',
    'test/fixtures/md/no-transforms.md',
    'test/fixtures/md/string.md',
    'test/fixtures/md/syntax-legacy-colon.md',
    'test/fixtures/md/syntax-legacy-query.md',
    'test/fixtures/md/syntax-mixed.md',
    'test/fixtures/md/transform-code.md',
    'test/fixtures/md/transform-custom.md',
    'test/fixtures/md/transform-file.md',
    'test/fixtures/md/transform-remote.md',
    'test/fixtures/md/transform-toc.md',
    'test/fixtures/md/transform-wordCount.md',
    'test/transforms.test.js'
  ])
})

test('getFilePaths glob', async () => {
  /*
  const x = await glob('**.md')
  console.log(x)
  process.exit(1)
  /** */

  const files = await getFilePaths(ROOT_DIR, {
    patterns: [
      /\.test\.js?$/,
      // /(.*)\.mdx?$/,
      'test/fixtures/md/**.{md,mdx}'
      // /^[^\/]+\.md?$/,
      // '**.json',
      // '**/**.js',
      // '**.md',
      //'/(.*).md$/',
      // '/^test/',
      // 'test/**'
      ///(.*)\.md/g
    ],
    ignore: [
      // /^node_modules\//,
      /node_modules/,
      // /(.*)\.js$/,
      // /\.git/,
      // /NOTES\.md/
    ],
    excludeGitIgnore: true,
    excludeHidden: true,
  })
  const foundFiles = convertToRelative(files, ROOT_DIR)
  console.log('foundFiles', foundFiles)
  /*
  aggregateReports()
  process.exit(1)
  /** */
  assert.is(Array.isArray(files), true)
  assert.equal(foundFiles, [
    'lib/block-parser-js.test.js',
    'lib/block-parser.test.js',
    'lib/cli.test.js',
    'lib/index.test.js',
    'lib/utils/fs.test.js',
    "lib/utils/md/find-frontmatter.test.js",
    "lib/utils/md/md.test.js",
    'lib/utils/text.test.js',
    // 'misc/old-test/main.test.js',
    'test/errors.test.js',
    'test/fixtures/md/basic.md',
    "test/fixtures/md/broken-inline.md",
    'test/fixtures/md/error-missing-transforms-two.md',
    'test/fixtures/md/error-missing-transforms.md',
    'test/fixtures/md/error-no-block-transform-defined.md',
    'test/fixtures/md/error-unbalanced.md',
    'test/fixtures/md/format-inline.md',
    'test/fixtures/md/format-with-wacky-indentation.md',
    'test/fixtures/md/inline-two.md',
    'test/fixtures/md/inline.md',
    'test/fixtures/md/mdx-file.mdx',
    'test/fixtures/md/missing-transform.md',
    'test/fixtures/md/mixed.md',
    'test/fixtures/md/no-transforms.md',
    'test/fixtures/md/string.md',
    'test/fixtures/md/syntax-legacy-colon.md',
    'test/fixtures/md/syntax-legacy-query.md',
    'test/fixtures/md/syntax-mixed.md',
    'test/fixtures/md/transform-code.md',
    'test/fixtures/md/transform-custom.md',
    'test/fixtures/md/transform-file.md',
    'test/fixtures/md/transform-remote.md',
    'test/fixtures/md/transform-toc.md',
    'test/fixtures/md/transform-wordCount.md',
    'test/transforms.test.js'
  ])
})

test('getGitignoreContents', async () => {
  const files = await getGitignoreContents()
  console.log('files', files)
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