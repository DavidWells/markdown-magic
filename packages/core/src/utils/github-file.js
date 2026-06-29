const https = require('https')
const { execFile } = require('child_process')
const { logRemoteRequest } = require('./remote-log')
const { withRemoteCache } = require('./remote-cache')
const { getTextBetweenLines } = require('./text')

const VALID_SLUG_REGEX = /^[A-Za-z0-9_.-]+$/
const VALID_FILE_REGEX = /^[^;\0]*$/

function ensureProtocol(str = '') {
  if (typeof str !== 'string') return ''
  const trimmed = str.trim()
  if (!trimmed) return ''
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getGithubUrl(str = '') {
  try {
    return new URL(ensureProtocol(str))
  } catch (_err) {
    return null
  }
}

function isGithubLink(str = '') {
  return isGithubRepoLink(str) || isGithubRawLink(str)
}

function isGithubRepoLink(str = '') {
  const url = getGithubUrl(str)
  if (!url) return false
  const segments = url.pathname.split('/').filter(Boolean)
  return url.hostname === 'github.com' && segments.length >= 5 && segments[2] === 'blob'
}

function isGithubRawLink(str = '') {
  const url = getGithubUrl(str)
  if (!url) return false
  const segments = url.pathname.split('/').filter(Boolean)
  return url.hostname === 'raw.githubusercontent.com' && segments.length >= 4
}

function convertLinkToRaw(link) {
  const details = resolveGithubDetails(link)
  if (!details) return link
  return toRawGithubUrl(details)
}

function toRawGithubUrl(details) {
  const ref = details.ref || details.branch
  if (!ref) return ''
  return `https://raw.githubusercontent.com/${details.repoOwner}/${details.repoName}/${ref}/${details.filePath}`
}

function resolveGithubDetails(repoFilePath, overrides = {}) {
  const url = getGithubUrl(repoFilePath)
  if (!url) return

  let result
  if (url.hostname === 'github.com') {
    result = parseGithubRepoUrl(url)
  } else if (url.hostname === 'raw.githubusercontent.com') {
    result = parseGithubRawUrl(url)
  }
  if (!result) return

  if (overrides.ref) {
    result.ref = overrides.ref
    delete result.branch
  } else if (overrides.branch) {
    result.branch = overrides.branch
    delete result.ref
  }

  if (overrides.path || overrides.filePath) {
    result.filePath = overrides.path || overrides.filePath
  }

  return result
}

function parseGithubRepoUrl(url) {
  const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const [repoOwner, repoName, blobSegment] = segments
  if (!repoOwner || !repoName || blobSegment !== 'blob') return

  const refAndPath = segments.slice(3)
  const parsed = parseRefAndPath(refAndPath)
  if (!parsed || !parsed.filePath) return

  return {
    repoOwner,
    repoName,
    filePath: parsed.filePath,
    range: parseLineRange(url.hash),
    [isGitHash(parsed.ref) ? 'ref' : 'branch']: parsed.ref
  }
}

function parseGithubRawUrl(url) {
  const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const [repoOwner, repoName] = segments
  if (!repoOwner || !repoName) return

  const parsed = parseRefAndPath(segments.slice(2))
  if (!parsed || !parsed.filePath) return

  return {
    repoOwner,
    repoName,
    filePath: parsed.filePath,
    range: parseLineRange(url.hash),
    [isGitHash(parsed.ref) ? 'ref' : 'branch']: parsed.ref
  }
}

function parseRefAndPath(segments) {
  if (!segments || segments.length < 2) return

  if (segments[0] === 'refs' && segments[1] === 'heads' && segments.length >= 4) {
    return {
      ref: `refs/heads/${segments[2]}`,
      filePath: segments.slice(3).join('/')
    }
  }

  return {
    ref: segments[0],
    filePath: segments.slice(1).join('/')
  }
}

/**
 * Resolves the contents of a file from a GitHub repository.
 *
 * @param {Object} options
 * @param {string} options.repoFilePath
 * @param {string} [options.githubToken]
 * @param {string} [options.accessToken]
 * @param {boolean} [options.allowPrivateGithub]
 * @param {boolean} [options.useGhCli]
 * @param {boolean} [options.preferGhCli]
 * @param {boolean} [options.debug]
 * @param {string} [options.ref]
 * @param {string} [options.branch]
 * @param {string} [options.path]
 * @param {string} [options.filePath]
 * @returns {Promise<string>}
 */
async function resolveGithubContents(options) {
  const result = await resolveGithubFile(options)
  return result.content
}

/**
 * Resolves a GitHub file and returns content plus fetch metadata.
 *
 * @param {Object} options
 * @returns {Promise<{content: string, source: string, details: Object}>}
 */
async function resolveGithubFile(options = {}) {
  const {
    repoFilePath,
    src = repoFilePath,
    debug = false,
    preferGhCli = false,
  } = options
  const allowPrivateGithub = resolvePrivateGithubSetting(options)
  const useGhCli = allowPrivateGithub && resolveGhCliSetting(options.useGhCli)
  const token = allowPrivateGithub ? resolveAccessToken(options.githubToken || options.accessToken) : undefined
  const logger = debug ? console.log : () => {}
  const githubDetails = resolveGithubDetails(src, options)
  if (!githubDetails) {
    throw new Error(`Invalid GitHub link. "${src}" is not a valid GitHub file link`)
  }

  logger(`GitHub file details "${src}"`, githubDetails)

  const payload = {
    ...githubDetails,
    accessToken: token,
    cwd: options.cwd,
    remoteCache: options.remoteCache,
    silent: options.silent,
    logRemoteRequests: options.logRemoteRequests
  }

  const errors = []
  const attempts = [
    ['raw', getGitHubFileContentsRaw]
  ]

  if (preferGhCli && useGhCli) {
    attempts.push(['gh', getGitHubFileContentsCli])
  }

  if (token) {
    attempts.push(['api', getGitHubFileContentsApi])
  }

  if (!preferGhCli && useGhCli) {
    attempts.push(['gh', getGitHubFileContentsCli])
  }

  if (!token) {
    attempts.push(['api', getGitHubFileContentsApi])
  }

  const attempted = new Set()
  for (const [source, fetcher] of attempts) {
    if (attempted.has(source)) continue
    attempted.add(source)
    try {
      const fileContent = await fetcher(payload)
      logger(`GitHub file resolved via ${source}`)
      return {
        content: returnCode(fileContent, githubDetails.range),
        source,
        details: githubDetails
      }
    } catch (err) {
      logger(`Unable to resolve GitHub file via ${source}`)
      errors.push(`${source}: ${err.message}`)
    }
  }

  const privateHint = allowPrivateGithub
    ? ''
    : '\nAuthenticated GitHub reads are disabled. If this file is private, rerun with allowPrivateGithub: true or --allow-private-github.'
  throw new Error(`Failed to fetch GitHub file "${src}".\n${errors.join('\n')}${privateHint}`)
}

function returnCode(fileContent, lines) {
  if (!lines) return fileContent
  const [startLine, endLine] = lines
  return getTextBetweenLines(fileContent, startLine, endLine)
}

async function getGitHubFileContentsCli(options) {
  validateInputs(options)
  const endpoint = buildContentsEndpoint(options)
  const requestUrl = `https://api.github.com${endpoint}`

  return withRemoteCache({
    immutable: isImmutableGitRef(options.ref || options.branch),
    privacyMode: 'private',
    settings: getRemoteSettings(options),
    source: 'gh-api',
    url: requestUrl,
    via: 'gh api'
  }, () => new Promise((resolve, reject) => {
    logRemoteRequest(requestUrl, {
      silent: options.silent,
      logRemoteRequests: options.logRemoteRequests,
      via: 'gh api'
    })

    execFile('gh', ['api', endpoint], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        const stderrMsg = stderr ? `: ${stderr.trim()}` : ''
        return reject(new Error(`${error.message}${stderrMsg}`))
      }

      try {
        const fileContent = JSON.parse(stdout).content
        return resolve(decode(fileContent))
      } catch (err) {
        return reject(new Error(`Unable to parse gh api response: ${err.message}`))
      }
    })
  }))
}

function getGitHubFileContentsApi(options) {
  validateInputs(options)
  const apiEndpoint = buildContentsEndpoint(options)
  const requestUrl = `https://api.github.com${apiEndpoint}`

  return withRemoteCache({
    immutable: isImmutableGitRef(options.ref || options.branch),
    privacyMode: options.accessToken ? 'private' : 'public',
    settings: getRemoteSettings(options),
    source: 'github-api',
    url: requestUrl
  }, () => new Promise((resolve, reject) => {
    logRemoteRequest(requestUrl, {
      silent: options.silent,
      logRemoteRequests: options.logRemoteRequests
    })

    const requestOptions = {
      hostname: 'api.github.com',
      path: apiEndpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'markdown-magic',
        Accept: 'application/vnd.github+json',
        ...(options.accessToken) ? { Authorization: `Bearer ${options.accessToken}` } : {},
      }
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const fileContent = JSON.parse(data).content
            resolve(decode(fileContent))
          } catch (err) {
            reject(new Error(`Unable to parse GitHub API response: ${err.message}`))
          }
        } else {
          reject(new Error(`Failed to fetch file. Status code: ${res.statusCode}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  }))
}

function getGitHubFileContentsRaw(options) {
  validateInputs(options)

  const {
    repoOwner,
    repoName,
    filePath,
    branch,
    ref,
    accessToken
  } = options
  const gitRef = ref || branch
  if (!gitRef) {
    return Promise.reject(new Error('Missing branch or ref for raw GitHub request'))
  }
  const requestPath = `/${repoOwner}/${repoName}/${encodePath(gitRef)}/${encodePath(filePath)}`
  const requestUrl = `https://raw.githubusercontent.com${requestPath}`

  return withRemoteCache({
    immutable: isImmutableGitRef(gitRef),
    privacyMode: accessToken ? 'private' : 'public',
    settings: getRemoteSettings(options),
    source: 'github-raw',
    url: requestUrl
  }, () => new Promise((resolve, reject) => {
    logRemoteRequest(requestUrl, {
      silent: options.silent,
      logRemoteRequests: options.logRemoteRequests
    })

    const requestOptions = {
      hostname: 'raw.githubusercontent.com',
      path: requestPath,
      method: 'GET',
      headers: {
        'User-Agent': 'markdown-magic',
        ...(accessToken) ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data)
        } else {
          reject(new Error(`Failed to fetch file. Status code: ${res.statusCode}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  }))
}

function getRemoteSettings(options = {}) {
  return {
    cwd: options.cwd,
    logRemoteRequests: options.logRemoteRequests,
    remoteCache: options.remoteCache,
    silent: options.silent
  }
}

function buildContentsEndpoint(options) {
  const {
    repoOwner,
    repoName,
    filePath,
    branch,
    ref,
  } = options

  const gitRef = ref || branch
  const encodedPath = encodePath(filePath)
  const suffix = gitRef ? `?ref=${encodeURIComponent(gitRef)}` : ''
  return `/repos/${repoOwner}/${repoName}/contents/${encodedPath}${suffix}`
}

function validateInputs({
  repoOwner,
  repoName,
  filePath,
  branch,
  ref,
}) {
  if (!VALID_SLUG_REGEX.test(repoOwner || '')) {
    throw new Error(`Invalid repoOwner "${repoOwner}"`)
  }
  if (!VALID_SLUG_REGEX.test(repoName || '')) {
    throw new Error(`Invalid repoName "${repoName}"`)
  }
  if (!filePath || !VALID_FILE_REGEX.test(filePath)) {
    throw new Error(`Invalid filePath "${filePath}"`)
  }
  if (branch && !VALID_FILE_REGEX.test(branch)) {
    throw new Error(`Invalid branch "${branch}"`)
  }
  if (ref && !VALID_FILE_REGEX.test(ref)) {
    throw new Error(`Invalid ref "${ref}"`)
  }
}

function resolveAccessToken(accessToken) {
  return accessToken || process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN
}

function resolvePrivateGithubSetting(options = {}) {
  return options.allowPrivateGithub === true
    || options.allowGithubPrivate === true
    || options.allowPrivate === true
}

function resolveGhCliSetting(useGhCli) {
  if (process.env.MARKDOWN_MAGIC_GH_CLI === '0' || process.env.MARKDOWN_MAGIC_GH_CLI === 'false') {
    return false
  }
  return typeof useGhCli === 'boolean' ? useGhCli : true
}

function decode(fileContent) {
  return Buffer.from((fileContent || '').replace(/\s/g, ''), 'base64').toString('utf-8')
}

function isGitHash(str) {
  const gitHashRegex = /^[vV]?[0-9a-fA-F]{40}$/
  return gitHashRegex.test(str)
}

function isImmutableGitRef(str) {
  return /^[0-9a-fA-F]{40}$/.test(str || '')
}

function parseLineRange(lineRangeString = '') {
  const matches = lineRangeString.match(/#L(\d+)-L(\d+)/)
  if (!matches) return
  const startLine = parseInt(matches[1], 10)
  const endLine = parseInt(matches[2], 10)
  return [startLine, endLine]
}

function encodePath(filePath) {
  return filePath.split('/').map(encodeURIComponent).join('/')
}

module.exports = {
  buildContentsEndpoint,
  convertLinkToRaw,
  getGitHubFileContentsApi,
  getGitHubFileContentsCli,
  getGitHubFileContentsRaw,
  isGithubLink,
  isGithubRawLink,
  isGithubRepoLink,
  parseLineRange,
  resolveAccessToken,
  resolveGithubDetails,
  resolveGithubContents,
  resolveGithubFile,
  resolvePrivateGithubSetting,
  isImmutableGitRef,
  toRawGithubUrl,
}
