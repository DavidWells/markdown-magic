const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  logRemoteRequest,
  resetRemoteRequestLog,
  sanitizeRequestUrl,
} = require('./remote-log')

test('remote-log - redacts sensitive query values', () => {
  const safeUrl = sanitizeRequestUrl('https://example.com/file.md?token=abc&foo=bar&x-amz-signature=123')
  assert.is(safeUrl, 'https://example.com/file.md?token=%5Bredacted%5D&foo=bar&x-amz-signature=%5Bredacted%5D')
})

test('remote-log - logs each request once and respects silent mode', () => {
  const originalLog = console.log
  const lines = []
  console.log = (line) => {
    lines.push(line)
  }

  resetRemoteRequestLog()
  logRemoteRequest('https://example.com/a.md?token=abc')
  logRemoteRequest('https://example.com/a.md?token=abc')
  logRemoteRequest('https://example.com/a.md?token=abc', { fromCache: true })
  logRemoteRequest('https://example.com/a.md?token=abc', { fromCache: true })
  logRemoteRequest('https://example.com/b.md', { silent: true })
  resetRemoteRequestLog()

  console.log = originalLog

  assert.is(lines.length, 2)
  assert.ok(lines[0].includes('Getting remote:'))
  assert.ok(lines[0].includes('https://example.com/a.md?token=%5Bredacted%5D'))
  assert.ok(lines[1].includes('Getting remote (from cache):'))
  assert.ok(lines[1].includes('https://example.com/a.md?token=%5Bredacted%5D'))
})

test.run()
