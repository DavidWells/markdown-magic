const { test } = require('uvu') 
const assert = require('uvu/assert')
const path = require('path')
const { deepLog } = require('./utils/logs')
const { getGlobGroupsFromArgs, parseCliArgv, runCli } = require('./cli-run')

const DEBUG = process.argv.includes('--debug')
const logger = (DEBUG) ? console.log : () => {}
const deepLogger = (DEBUG) ? deepLog : () => {}

function logInput(rawArgs) {
  logger('\n───────────────────────')
  logger('Input:')
  logger(rawArgs.join(" "))
  logger('───────────────────────\n')
}

test('Exports API', () => {
  assert.equal(typeof runCli, 'function', 'undefined val')
  assert.equal(typeof parseCliArgv, 'function', 'undefined val')
  assert.equal(typeof getGlobGroupsFromArgs, 'function', 'undefined val')
})

test('CLI parser uses dxParse for forgiving single-dash file and config options', () => {
  const rawArgv = [ '-files', 'README.md', '-config', 'md.config.js', '-dry' ]
  const result = parseCliArgv(rawArgv)
  deepLogger('result', result)
  assert.equal(result, {
    files: ['README.md'],
    config: 'md.config.js',
    dry: true
  })
})

test('CLI parser maps file/path globs and ignore groups into markdown-magic options', () => {
  const rawArgv = [
    '--path',
    'docs/**/*.md',
    '--file',
    'README.md',
    '--ignore',
    'dist/**/*.md',
    '--output',
    'out'
  ]
  const result = parseCliArgv(rawArgv)
  deepLogger('result', result)
  assert.equal(result, {
    files: ['README.md', 'docs/**/*.md'],
    ignore: ['dist/**/*.md'],
    output: 'out'
  })
})

test('CLI parser maps private GitHub opt-in flag', () => {
  const result = parseCliArgv([
    '--allow-private-github',
    '--files',
    'README.md'
  ])
  deepLogger('result', result)
  assert.equal(result, {
    files: ['README.md'],
    allowPrivateGithub: true
  })
})

test('CLI parser maps cache disable flags', () => {
  const noCache = parseCliArgv([
    '--no-cache',
    '--files',
    'README.md'
  ])
  const noRemoteCache = parseCliArgv([
    '--no-remote-cache',
    '--files',
    'README.md'
  ])

  assert.equal(noCache, {
    files: ['README.md'],
    remoteCache: false
  })
  assert.equal(noRemoteCache, {
    files: ['README.md'],
    remoteCache: false
  })
})

test('CLI parser keeps shell-expanded files out of command options', () => {
  const rawArgv = [
    'CONTRIBUTING.md',
    'NOTES.md',
    'README.md',
    'foo',
    'bar',
    '=',
    'false'
  ]
  const result = parseCliArgv(rawArgv)
  deepLogger('result', result)
  assert.equal(result, {
    files: ['CONTRIBUTING.md', 'NOTES.md', 'README.md'],
    foo: true,
    bar: false
  })
})

test('runCli sends dxParse-normalized options to markdownMagic', async () => {
  const configFile = path.join(__dirname, '..', '..', '..', 'md.config.js')
  const rawArgv = [ '-files', 'README.md', '-config', configFile, '-dry' ]
  let receivedConfig
  const result = await runCli({ _: ['README.md'] }, rawArgv, {
    markdownMagic: async (config) => {
      receivedConfig = config
      return config
    }
  })
  assert.equal(result, receivedConfig)
  assert.equal(receivedConfig.files, ['README.md'])
  assert.equal(receivedConfig.config, configFile)
  assert.equal(receivedConfig.dry, true)
})

test.run()
