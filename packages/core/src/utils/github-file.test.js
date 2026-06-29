const { EventEmitter } = require('events')
const fs = require('fs')
const https = require('https')
const os = require('os')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  buildContentsEndpoint,
  convertLinkToRaw,
  getGitHubFileContentsApi,
  getGitHubFileContentsRaw,
  isGithubLink,
  isGithubRawLink,
  isImmutableGitRef,
  resolveAccessToken,
  resolveGithubDetails,
  resolvePrivateGithubSetting,
  toRawGithubUrl,
} = require('./github-file')
const { clearMemoryRemoteCache } = require('./remote-cache')
const { resetRemoteRequestLog } = require('./remote-log')

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-magic-github-cache-test-'))
}

function cleanup(dir) {
  fs.rmSync(dir, { force: true, recursive: true })
}

function stubHttpsRequest(handler) {
  const original = https.request
  https.request = (options, callback) => {
    const req = new EventEmitter()
    req.end = () => {
      const response = new EventEmitter()
      const result = handler(options)
      response.statusCode = result.statusCode || 200
      process.nextTick(() => {
        callback(response)
        response.emit('data', result.body || '')
        response.emit('end')
      })
    }
    return req
  }
  return () => {
    https.request = original
  }
}

test.before.each(() => {
  clearMemoryRemoteCache()
  resetRemoteRequestLog()
})

test('github-file - detects GitHub file URLs', () => {
  assert.ok(isGithubLink('https://github.com/DavidWells/markdown-magic/blob/master/package.json'))
  assert.ok(isGithubLink('github.com/DavidWells/markdown-magic/blob/master/package.json'))
  assert.ok(isGithubLink('https://raw.githubusercontent.com/DavidWells/markdown-magic/master/package.json'))
  assert.ok(isGithubRawLink('raw.githubusercontent.com/DavidWells/markdown-magic/master/package.json'))
  assert.not.ok(isGithubLink('https://github.com/DavidWells/markdown-magic'))
  assert.not.ok(isGithubLink('https://example.com/file.md'))
})

test('github-file - parses GitHub blob URL details', () => {
  const details = resolveGithubDetails('https://github.com/DavidWells/markdown-magic/blob/master/packages/core/src/index.js#L10-L20')
  assert.equal(details, {
    repoOwner: 'DavidWells',
    repoName: 'markdown-magic',
    filePath: 'packages/core/src/index.js',
    range: [10, 20],
    branch: 'master'
  })
})

test('github-file - parses raw GitHub URL details', () => {
  const details = resolveGithubDetails('raw.githubusercontent.com/DavidWells/markdown-magic/master/packages/core/src/index.js')
  assert.equal(details, {
    repoOwner: 'DavidWells',
    repoName: 'markdown-magic',
    filePath: 'packages/core/src/index.js',
    range: undefined,
    branch: 'master'
  })
})

test('github-file - parses refs/heads URLs', () => {
  const details = resolveGithubDetails('https://raw.githubusercontent.com/DavidWells/markdown-magic/refs/heads/master/packages/core/src/index.js')
  assert.equal(details, {
    repoOwner: 'DavidWells',
    repoName: 'markdown-magic',
    filePath: 'packages/core/src/index.js',
    range: undefined,
    branch: 'refs/heads/master'
  })
})

test('github-file - applies explicit ref and path overrides', () => {
  const details = resolveGithubDetails('https://github.com/owner/repo/blob/feature/docs/packages/a/README.md', {
    ref: 'feature/docs',
    path: 'packages/a/README.md'
  })
  assert.equal(details, {
    repoOwner: 'owner',
    repoName: 'repo',
    filePath: 'packages/a/README.md',
    range: undefined,
    ref: 'feature/docs'
  })
})

test('github-file - builds raw and API URLs from parsed details', () => {
  const details = resolveGithubDetails('https://github.com/DavidWells/markdown-magic/blob/master/packages/core/src/index.js')
  assert.is(toRawGithubUrl(details), 'https://raw.githubusercontent.com/DavidWells/markdown-magic/master/packages/core/src/index.js')
  assert.is(convertLinkToRaw('https://github.com/DavidWells/markdown-magic/blob/master/packages/core/src/index.js'), 'https://raw.githubusercontent.com/DavidWells/markdown-magic/master/packages/core/src/index.js')
  assert.is(buildContentsEndpoint(details), '/repos/DavidWells/markdown-magic/contents/packages/core/src/index.js?ref=master')
})

test('github-file - resolves tokens from explicit values and known env vars only', () => {
  const previousGithubToken = process.env.GITHUB_TOKEN
  const previousAccessToken = process.env.GITHUB_ACCESS_TOKEN
  process.env.GITHUB_TOKEN = 'token-from-env'
  delete process.env.GITHUB_ACCESS_TOKEN
  process.env.MARKDOWN_MAGIC_TEST_TOKEN = 'token-from-reference'

  assert.is(resolveAccessToken('explicit-token'), 'explicit-token')
  assert.is(resolveAccessToken('process.env.MARKDOWN_MAGIC_TEST_TOKEN'), 'process.env.MARKDOWN_MAGIC_TEST_TOKEN')
  assert.is(resolveAccessToken(), 'token-from-env')

  if (previousGithubToken === undefined) {
    delete process.env.GITHUB_TOKEN
  } else {
    process.env.GITHUB_TOKEN = previousGithubToken
  }
  if (previousAccessToken === undefined) {
    delete process.env.GITHUB_ACCESS_TOKEN
  } else {
    process.env.GITHUB_ACCESS_TOKEN = previousAccessToken
  }
  delete process.env.MARKDOWN_MAGIC_TEST_TOKEN
})

test('github-file - private GitHub access is opt-in', () => {
  assert.is(resolvePrivateGithubSetting(), false)
  assert.is(resolvePrivateGithubSetting({ githubToken: 'explicit-token' }), false)
  assert.is(resolvePrivateGithubSetting({ accessToken: 'explicit-token' }), false)
  assert.is(resolvePrivateGithubSetting({ useGhCli: true }), false)
  assert.is(resolvePrivateGithubSetting({ allowPrivateGithub: true }), true)
  assert.is(resolvePrivateGithubSetting({ allowGithubPrivate: true }), true)
  assert.is(resolvePrivateGithubSetting({ allowPrivate: true }), true)
})

test('github-file - detects only full commit SHAs as immutable refs', () => {
  assert.is(isImmutableGitRef('e158f5976ef59c892ca7745ab5147d1bbc43adec'), true)
  assert.is(isImmutableGitRef('refs/heads/main'), false)
  assert.is(isImmutableGitRef('master'), false)
  assert.is(isImmutableGitRef('v158f5976ef59c892ca7745ab5147d1bbc43adec'), false)
  assert.is(isImmutableGitRef('e158f59'), false)
})

test('github-file - caches raw GitHub text fetches', async () => {
  const dir = tempDir()
  let calls = 0
  const restore = stubHttpsRequest(() => {
    calls++
    return { body: `raw-${calls}` }
  })

  try {
    const options = {
      branch: 'e158f5976ef59c892ca7745ab5147d1bbc43adec',
      filePath: 'README.md',
      remoteCache: {
        directory: dir
      },
      repoName: 'repo',
      repoOwner: 'owner',
      silent: true
    }
    const first = await getGitHubFileContentsRaw(options)
    const second = await getGitHubFileContentsRaw(options)

    assert.is(first, 'raw-1')
    assert.is(second, 'raw-1')
    assert.is(calls, 1)
  } finally {
    restore()
    cleanup(dir)
  }
})

test('github-file - caches decoded GitHub API fetches', async () => {
  const dir = tempDir()
  let calls = 0
  const restore = stubHttpsRequest(() => {
    calls++
    return {
      body: JSON.stringify({
        content: Buffer.from(`api-${calls}`).toString('base64')
      })
    }
  })

  try {
    const options = {
      branch: 'master',
      filePath: 'README.md',
      remoteCache: {
        directory: dir
      },
      repoName: 'repo',
      repoOwner: 'owner',
      silent: true
    }
    const first = await getGitHubFileContentsApi(options)
    const second = await getGitHubFileContentsApi(options)

    assert.is(first, 'api-1')
    assert.is(second, 'api-1')
    assert.is(calls, 1)
  } finally {
    restore()
    cleanup(dir)
  }
})

test.run()
