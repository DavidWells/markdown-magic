const { info } = require('./logs')

const loggedRemoteRequests = new Set()
const SENSITIVE_QUERY_KEYS = /^(access[-_]?token|auth|authorization|client[-_]?secret|code|key|secret|sig|signature|token|x-amz-signature|x-amz-security-token)$/i

function logRemoteRequest(url, options = {}) {
  if (options.logRemoteRequests === false || options.silent) return

  const safeUrl = sanitizeRequestUrl(url)
  const source = options.fromCache ? 'cache' : 'request'
  const key = `${source} ${options.method || 'GET'} ${safeUrl}`
  if (loggedRemoteRequests.has(key)) return
  loggedRemoteRequests.add(key)

  const suffix = options.via ? ` (${options.via})` : ''
  const cacheText = options.fromCache ? ' (from cache)' : ''
  info(` Getting remote${cacheText}: \n  ${safeUrl}${suffix}`, false, '🌐  ')
}

function sanitizeRequestUrl(url) {
  if (typeof url !== 'string') return ''

  try {
    const parsed = new URL(url)
    parsed.username = ''
    parsed.password = ''
    parsed.searchParams.forEach((_value, key) => {
      if (SENSITIVE_QUERY_KEYS.test(key)) {
        parsed.searchParams.set(key, '[redacted]')
      }
    })
    return parsed.toString()
  } catch (_err) {
    return url
  }
}

function resetRemoteRequestLog() {
  loggedRemoteRequests.clear()
}

module.exports = {
  logRemoteRequest,
  resetRemoteRequestLog,
  sanitizeRequestUrl,
}
