const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { clearMemoryRemoteCache } = require('./remote-cache')
const { remoteRequest } = require('./remoteRequest')
const { resetRemoteRequestLog } = require('./remote-log')

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-magic-remote-request-test-'))
}

function cleanup(dir) {
  fs.rmSync(dir, { force: true, recursive: true })
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => {
      resolve(server.address().port)
    })
  })
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

test.before.each(() => {
  clearMemoryRemoteCache()
  resetRemoteRequestLog()
})

test('remoteRequest - caches successful generic remote content', async () => {
  const dir = tempDir()
  let calls = 0
  const server = http.createServer((_req, res) => {
    calls++
    res.end(`call-${calls}`)
  })
  const port = await listen(server)

  try {
    const settings = {
      remoteCache: {
        directory: dir,
        ttl: 1000
      },
      silent: true
    }
    const url = `http://127.0.0.1:${port}/readme.md`
    const first = await remoteRequest(url, settings)
    const second = await remoteRequest(url, settings)

    assert.is(first, 'call-1')
    assert.is(second, 'call-1')
    assert.is(calls, 1)
  } finally {
    await close(server)
    cleanup(dir)
  }
})

test('remoteRequest - remoteCache false preserves uncached behavior', async () => {
  const dir = tempDir()
  let calls = 0
  const server = http.createServer((_req, res) => {
    calls++
    res.end(`call-${calls}`)
  })
  const port = await listen(server)

  try {
    const settings = {
      remoteCache: false,
      silent: true
    }
    const url = `http://127.0.0.1:${port}/readme.md`
    const first = await remoteRequest(url, settings)
    const second = await remoteRequest(url, settings)

    assert.is(first, 'call-1')
    assert.is(second, 'call-2')
    assert.is(calls, 2)
  } finally {
    await close(server)
    cleanup(dir)
  }
})

test.run()
