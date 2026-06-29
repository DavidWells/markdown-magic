const path = require('path')
const { remoteRequest } = require('../utils/remoteRequest')
const { isGithubLink, resolveGithubContents } = require('../utils/github-file')
const { formatMd } = require('../utils/format-md')

module.exports = async function REMOTE(api) {
  // console.log('REMOTE api', api)
  const { options, content, settings } = api
  const { regex } = settings
  const remoteUrl = options.url || options.src || options.URL || options.Url

  // console.log('MAKE REMOTE REQUEST')
  let remoteContent
  if (isGithubLink(remoteUrl)) {
    try {
      remoteContent = await resolveGithubContents({
        repoFilePath: remoteUrl,
        githubToken: options.githubToken,
        allowPrivateGithub: isPrivateGithubAllowed(settings),
        useGhCli: resolveGithubOption(options.useGhCli, settings.github && settings.github.useGhCli),
        preferGhCli: resolveGithubOption(options.preferGhCli, settings.github && settings.github.preferGhCli),
        debug: resolveGithubOption(options.debugGithub, settings.github && settings.github.debug),
        ref: options.ref,
        branch: options.branch,
        path: options.path,
        filePath: options.filePath,
        cwd: settings.cwd,
        remoteCache: settings.remoteCache,
        silent: settings.silent,
        logRemoteRequests: settings.logRemoteRequests
      })
    } catch (err) {
      if (settings.failOnMissingRemote) {
        const contextText = formatRemoteErrorContext(api, remoteUrl)
        throw new Error(`Remote GitHub request failed for\n  "${remoteUrl}".${contextText}\n${err.message}`)
      }
    }
  }

  if (!remoteContent) {
    remoteContent = await remoteRequest(remoteUrl, settings, api.srcPath)
  }
  if (!remoteContent) {
    return content
  }

  const ext = path.extname(remoteUrl).toLowerCase()
  const isMarkdown = ext === '.md' || ext === '.markdown' || ext === '.mdown' || ext === '.mdx'
  
  if (isMarkdown) {
    remoteContent = formatMd(remoteContent, options)
  }

  if (options.keepComments) {
    return remoteContent
  }
  
  // console.log('REMOTE', remoteContent)
  return remoteContent.replace(regex.open, '').replace(regex.close, '')
}

function resolveGithubOption(blockValue, settingsValue) {
  if (typeof blockValue !== 'undefined') return blockValue
  return settingsValue
}

function isPrivateGithubAllowed(settings = {}) {
  const github = settings.github || {}
  return settings.allowPrivateGithub === true
    || settings.allowGithubPrivate === true
    || github.allowPrivate === true
    || github.allowPrivateGithub === true
}

function formatRemoteErrorContext(api = {}, remoteUrl) {
  const sourceLocation = getRemoteSourceLocation(api)
  if (!sourceLocation) return ''
  return `\nSource markdown: ${sourceLocation}\nFix "${remoteUrl}" value in ${sourceLocation}`
}

function getRemoteSourceLocation(api = {}) {
  if (typeof api.getBlockDetails === 'function') {
    try {
      const details = api.getBlockDetails()
      if (details && details.sourceLocation) return details.sourceLocation
    } catch (_err) {
      // Fall through to srcPath. Error reporting should not mask the original fetch failure.
    }
  }

  return api.srcPath
}
