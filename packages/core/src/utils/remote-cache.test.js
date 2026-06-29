const fs = require('fs')
const os = require('os')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  buildRemoteCacheKey,
  clearMemoryRemoteCache,
  normalizeRemoteCacheOptions,
  withRemoteCache,
} = require('./remote-cache')
const { resetRemoteRequestLog } = require('./remote-log')

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-magic-cache-test-'))
}

function cleanup(dir) {
  fs.rmSync(dir, { force: true, recursive: true })
}

function cacheFiles(dir, key) {
  const shard = key.slice(0, 2)
  return {
    bodyPath: path.join(dir, shard, `${key}.body`),
    metaPath: path.join(dir, shard, `${key}.meta.json`)
  }
}

function request(dir, overrides = {}) {
  return {
    privacyMode: 'public',
    settings: {
      remoteCache: {
        directory: dir,
        ttl: 1000
      },
      silent: true
    },
    source: 'generic',
    url: 'https://example.com/readme.md',
    ...overrides
  }
}

test.before.each(() => {
  clearMemoryRemoteCache()
  resetRemoteRequestLog()
})

test('remote-cache - builds stable keys and separates source and privacy', () => {
  const base = {
    privacyMode: 'public',
    source: 'generic',
    url: 'https://example.com/readme.md?token=secret'
  }
  const first = buildRemoteCacheKey(base)
  const second = buildRemoteCacheKey(base)
  const differentSource = buildRemoteCacheKey({ ...base, source: 'github-raw' })
  const differentPrivacy = buildRemoteCacheKey({ ...base, privacyMode: 'private' })

  assert.is(first, second)
  assert.not(first === differentSource)
  assert.not(first === differentPrivacy)
})

test('remote-cache - normalizes options and default disable forms', () => {
  const defaultOptions = normalizeRemoteCacheOptions({ silent: true })
  const disabledFalse = normalizeRemoteCacheOptions({ remoteCache: false })
  const disabledObject = normalizeRemoteCacheOptions({ remoteCache: { enabled: false } })

  assert.is(defaultOptions.enabled, true)
  assert.is(defaultOptions.ttl, 300000)
  assert.is(defaultOptions.cachePrivate, true)
  assert.is(disabledFalse.enabled, false)
  assert.is(disabledObject.enabled, false)
})

test('remote-cache - writes and reads successful text responses', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir)
    const first = await withRemoteCache(req, async () => {
      calls++
      return 'hello cache'
    })
    const second = await withRemoteCache(req, async () => {
      calls++
      return 'new value'
    })

    assert.is(first, 'hello cache')
    assert.is(second, 'hello cache')
    assert.is(calls, 1)
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - expired entries are ignored', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir, {
      settings: {
        remoteCache: {
          directory: dir,
          ttl: 0
        },
        silent: true
      }
    })
    await withRemoteCache(req, async () => {
      calls++
      return 'expired soon'
    })
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await withRemoteCache(req, async () => {
      calls++
      return 'fresh value'
    })

    assert.is(second, 'fresh value')
    assert.is(calls, 2)
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - immutable entries use immutable TTL metadata', async () => {
  const dir = tempDir()

  try {
    const req = request(dir, {
      immutable: true,
      settings: {
        remoteCache: {
          directory: dir,
          immutableTtl: 60000,
          ttl: 10
        },
        silent: true
      }
    })
    await withRemoteCache(req, async () => 'immutable content')
    const key = buildRemoteCacheKey(req)
    const meta = JSON.parse(fs.readFileSync(cacheFiles(dir, key).metaPath, 'utf8'))
    const created = Date.parse(meta.createdAt)
    const expires = Date.parse(meta.expiresAt)

    assert.is(meta.immutable, true)
    assert.ok(expires - created >= 59000)
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - corrupt metadata is ignored and replaced on success', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir)
    const key = buildRemoteCacheKey(req)
    const files = cacheFiles(dir, key)
    fs.mkdirSync(path.dirname(files.metaPath), { recursive: true })
    fs.writeFileSync(files.metaPath, '{nope')
    fs.writeFileSync(files.bodyPath, 'bad')

    const result = await withRemoteCache(req, async () => {
      calls++
      return 'good'
    })

    assert.is(result, 'good')
    assert.is(calls, 1)
    assert.is(fs.readFileSync(files.bodyPath, 'utf8'), 'good')
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - remoteCache false disables caching', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir, {
      settings: {
        remoteCache: false,
        silent: true
      }
    })
    await withRemoteCache(req, async () => {
      calls++
      return 'one'
    })
    const second = await withRemoteCache(req, async () => {
      calls++
      return 'two'
    })

    assert.is(second, 'two')
    assert.is(calls, 2)
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - cachePrivate false skips private disk writes', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir, {
      privacyMode: 'private',
      settings: {
        remoteCache: {
          cachePrivate: false,
          directory: dir
        },
        silent: true
      }
    })
    await withRemoteCache(req, async () => {
      calls++
      return 'private one'
    })
    const second = await withRemoteCache(req, async () => {
      calls++
      return 'private two'
    })

    assert.is(second, 'private two')
    assert.is(calls, 2)
    assert.not.ok(fs.existsSync(cacheFiles(dir, buildRemoteCacheKey(req)).bodyPath))
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - cachePrivate false still shares concurrent private fetches', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir, {
      privacyMode: 'private',
      settings: {
        remoteCache: {
          cachePrivate: false,
          directory: dir
        },
        silent: true
      }
    })
    const [first, second] = await Promise.all([
      withRemoteCache(req, async () => {
        calls++
        await new Promise((resolve) => setTimeout(resolve, 20))
        return 'private shared'
      }),
      withRemoteCache(req, async () => {
        calls++
        return 'private duplicate'
      })
    ])

    assert.is(first, 'private shared')
    assert.is(second, 'private shared')
    assert.is(calls, 1)
    assert.not.ok(fs.existsSync(cacheFiles(dir, buildRemoteCacheKey(req)).bodyPath))
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - shares concurrent duplicate fetches through single flight', async () => {
  const dir = tempDir()
  let calls = 0

  try {
    const req = request(dir)
    const [first, second] = await Promise.all([
      withRemoteCache(req, async () => {
        calls++
        await new Promise((resolve) => setTimeout(resolve, 20))
        return 'shared'
      }),
      withRemoteCache(req, async () => {
        calls++
        return 'duplicate'
      })
    ])

    assert.is(first, 'shared')
    assert.is(second, 'shared')
    assert.is(calls, 1)
  } finally {
    cleanup(dir)
  }
})

test('remote-cache - logs cache hits with remote wording', async () => {
  const dir = tempDir()
  const originalLog = console.log
  const lines = []
  console.log = (line) => {
    lines.push(line)
  }

  try {
    const req = request(dir, {
      settings: {
        remoteCache: {
          directory: dir
        }
      }
    })
    await withRemoteCache(req, async () => 'cached body')
    await withRemoteCache(req, async () => 'new body')

    assert.is(lines.length, 1)
    assert.ok(lines[0].includes('Getting remote (from cache):'))
    assert.ok(lines[0].includes('https://example.com/readme.md'))
  } finally {
    console.log = originalLog
    cleanup(dir)
  }
})

test('remote-cache - remoteCache logHits false suppresses cache hit logs', async () => {
  const dir = tempDir()
  const originalLog = console.log
  const lines = []
  console.log = (line) => {
    lines.push(line)
  }

  try {
    const req = request(dir, {
      settings: {
        remoteCache: {
          directory: dir,
          logHits: false
        }
      }
    })
    await withRemoteCache(req, async () => 'cached body')
    await withRemoteCache(req, async () => 'new body')

    assert.is(lines.length, 0)
  } finally {
    console.log = originalLog
    cleanup(dir)
  }
})

test.run()
