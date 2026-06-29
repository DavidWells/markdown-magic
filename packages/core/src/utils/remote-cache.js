const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { logRemoteRequest, sanitizeRequestUrl } = require('./remote-log')

const CACHE_VERSION = 'remote-cache-v1'
const META_VERSION = 1
const DEFAULT_TTL = 5 * 60 * 1000
const DEFAULT_IMMUTABLE_TTL = 30 * 24 * 60 * 60 * 1000
const inflight = new Map()

function normalizeRemoteCacheOptions(settings = {}) {
  const raw = settings.remoteCache
  const disabled = raw === false || (raw && raw.enabled === false)
  const config = raw && typeof raw === 'object' ? raw : {}
  const baseDir = config.directory
    ? resolveCacheDir(config.directory, settings)
    : getDefaultRemoteCacheDir()

  return {
    enabled: !disabled,
    cachePrivate: config.cachePrivate !== false,
    directory: baseDir,
    immutableTtl: normalizeTtl(config.immutableTtl, DEFAULT_IMMUTABLE_TTL),
    logHits: config.logHits !== false,
    ttl: normalizeTtl(config.ttl, DEFAULT_TTL)
  }
}

function normalizeTtl(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }
  return fallback
}

function resolveCacheDir(cacheDir, settings = {}) {
  if (path.isAbsolute(cacheDir)) return cacheDir
  return path.resolve(settings.cwd || process.cwd(), cacheDir)
}

function getDefaultRemoteCacheDir() {
  const home = os.homedir()
  if (process.env.XDG_CACHE_HOME) {
    return path.join(process.env.XDG_CACHE_HOME, 'markdown-magic', CACHE_VERSION)
  }
  if (process.platform === 'darwin' && home) {
    return path.join(home, 'Library', 'Caches', 'markdown-magic', CACHE_VERSION)
  }
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'markdown-magic', CACHE_VERSION)
  }
  if (home) {
    return path.join(home, '.cache', 'markdown-magic', CACHE_VERSION)
  }
  return path.join(os.tmpdir(), 'markdown-magic', CACHE_VERSION)
}

function buildRemoteCacheKey(request = {}) {
  const method = request.method || 'GET'
  const canonicalUrl = sanitizeRequestUrl(request.url || '')
  const source = request.source || 'generic'
  const privacyMode = request.privacyMode || 'public'
  return crypto
    .createHash('sha256')
    .update(`${method}\n${canonicalUrl}\n${source}\n${privacyMode}\n${CACHE_VERSION}`)
    .digest('hex')
}

async function withRemoteCache(request = {}, fetcher) {
  const settings = request.settings || {}
  const options = normalizeRemoteCacheOptions(settings)

  if (!options.enabled) {
    return fetcher()
  }

  const privacyMode = request.privacyMode || 'public'
  const shouldWriteToDisk = privacyMode !== 'private' || options.cachePrivate
  const key = buildRemoteCacheKey(request)
  const cacheFiles = getCacheFiles(options.directory, key)

  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const promise = (async () => {
    await Promise.resolve()

    if (shouldWriteToDisk) {
      const cached = await readCacheEntry(cacheFiles, key)
      if (cached !== undefined) {
        logCacheHit(request, settings, options)
        return cached
      }
    }

    const value = await fetcher()
    if (typeof value === 'string' && shouldWriteToDisk) {
      await writeCacheEntry(cacheFiles, key, value, request, options)
    }
    return value
  })()

  inflight.set(key, promise)

  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

function logCacheHit(request, settings, options) {
  if (!options.logHits) return
  logRemoteRequest(request.url, {
    fromCache: true,
    logRemoteRequests: settings.logRemoteRequests,
    method: request.method,
    silent: settings.silent,
    via: request.via
  })
}

function getCacheFiles(cacheDir, key) {
  const shard = key.slice(0, 2)
  const dir = path.join(cacheDir, shard)
  return {
    bodyPath: path.join(dir, `${key}.body`),
    dir,
    metaPath: path.join(dir, `${key}.meta.json`)
  }
}

async function readCacheEntry(files, key) {
  try {
    const metaText = await fs.promises.readFile(files.metaPath, 'utf8')
    const meta = JSON.parse(metaText)
    if (!meta || meta.version !== META_VERSION || meta.key !== key) return
    if (!meta.expiresAt || Date.now() > Date.parse(meta.expiresAt)) return
    return await fs.promises.readFile(files.bodyPath, 'utf8')
  } catch (_err) {
    return
  }
}

async function writeCacheEntry(files, key, body, request, options) {
  await fs.promises.mkdir(files.dir, { recursive: true, mode: 0o700 })

  const now = Date.now()
  const ttl = resolveRequestTtl(request, options)
  const meta = {
    bytes: Buffer.byteLength(body, 'utf8'),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
    immutable: request.immutable === true,
    key,
    privacyMode: request.privacyMode || 'public',
    source: request.source || 'generic',
    url: sanitizeRequestUrl(request.url || ''),
    version: META_VERSION
  }

  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const bodyTmp = `${files.bodyPath}.tmp-${nonce}`
  const metaTmp = `${files.metaPath}.tmp-${nonce}`

  await fs.promises.writeFile(bodyTmp, body, { mode: 0o600 })
  await fs.promises.writeFile(metaTmp, `${JSON.stringify(meta, null, 2)}\n`, { mode: 0o600 })
  await fs.promises.rename(bodyTmp, files.bodyPath)
  await fs.promises.rename(metaTmp, files.metaPath)
}

function resolveRequestTtl(request, options) {
  if (typeof request.ttl === 'number' && Number.isFinite(request.ttl) && request.ttl >= 0) {
    return request.ttl
  }
  if (request.immutable) {
    return options.immutableTtl
  }
  return options.ttl
}

function clearMemoryRemoteCache() {
  inflight.clear()
}

module.exports = {
  CACHE_VERSION,
  buildRemoteCacheKey,
  clearMemoryRemoteCache,
  getDefaultRemoteCacheDir,
  normalizeRemoteCacheOptions,
  withRemoteCache,
}
