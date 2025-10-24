const githubContributors = require('github-contributors')
const remoteOriginUrl = require('remote-origin-url')
const githubUrlFromGit = require('github-url-from-git')
const deepmerge = require('deepmerge')

const defaults = {
  format: 'table', // 'table', 'list', 'aligned'
}

function formatContributors(contributors, format) {
  switch (format) {
    case 'table':
      return formatTable(contributors)
    case 'list':
      return formatList(contributors)
    case 'aligned':
      return formatAligned(contributors)
    default:
      return formatTable(contributors)
  }
}

function formatTable(contributors) {
  const headers = [
    '| **Contributors** | **Commits** |',
    '| --- | --- |'
  ]
  
  const rows = contributors.map(contributor => {
    const avatar = `<img src="${contributor.avatar_url}&s=100" width="50" height="50" alt="${contributor.login}"/>`
    const profile = `[${contributor.login}](${contributor.html_url})`
    return `| ${avatar}<br/>${profile} | ${contributor.contributions} |`
  })
  
  return headers.concat(rows).join('\n')
}

function formatList(contributors) {
  return contributors.map(contributor => {
    return `- [${contributor.login}](${contributor.html_url}) - ${contributor.contributions} commits`
  }).join('\n')
}

function formatAligned(contributors) {
  const contributorElements = contributors.map(contributor => {
    const avatar = `<img src="${contributor.avatar_url}&s=100" width="100" height="100" alt="${contributor.login}"/>`
    const profile = `[${contributor.login}](${contributor.html_url})`
    return `<td align="center">${avatar}<br/><sub><b>${profile}</b></sub><br/><sub>${contributor.contributions} commits</sub></td>`
  })
  
  // Group contributors into rows of 7
  const rows = []
  for (let i = 0; i < contributorElements.length; i += 7) {
    const rowElements = contributorElements.slice(i, i + 7)
    rows.push(`<tr>${rowElements.join('')}</tr>`)
  }
  
  return `<table>${rows.join('')}</table>`
}

async function getRepositoryFromOrigin() {
  try {
    const remoteUrl = await remoteOriginUrl()
    if (!remoteUrl) return null
    
    const githubUrl = githubUrlFromGit(remoteUrl)
    if (!githubUrl) return null
    
    // Extract owner/repo from GitHub URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * ### > CONTRIBUTORS
 *
 * Generate a table of GitHub repository contributors automatically
 *
 * **Options:**
 * - `repo` (optional): GitHub repository in format `owner/repo`. Default: auto-detected from git remote
 * - `format` (optional): Output format. Options: `table`, `list`, `aligned`. Default: `table`
 * - `token` (optional): GitHub API token for authentication. Default: uses GITHUB_TOKEN env var
 *
 * **Example:**
 * ```md
 * <!-- docs CONTRIBUTORS -->
 * Contributors table will be generated here
 * <!-- /docs -->
 * ```
 *
 * ```md
 * <!-- docs CONTRIBUTORS format=list -->
 * Contributors list will be generated here
 * <!-- /docs -->
 * ```
 *
 * ```md
 * <!-- docs CONTRIBUTORS repo=owner/reponame format=aligned -->
 * Contributors table will be generated here
 * <!-- /docs -->
 * ```
 *
 * Default `matchWord` is `CONTRIBUTORS`
 *
 * ---
 * @typedef {Object} ContributorsOptions
 * @property {string} [format='table'] - Output format: 'table', 'list', or 'aligned'
 * @property {string} [repo] - GitHub repository in format 'owner/repo' (auto-detected if not provided)
 * @property {string} [token] - GitHub token for API authentication (uses GITHUB_TOKEN env var if not provided)
 *
 * @param {object} api The markdown-magic API object
 * @param {string} api.content The current content of the comment block
 * @param {ContributorsOptions} api.options The options passed in from the comment declaration
 * @param {string} api.originalPath The path of the file being processed
 * @param {string} api.currentFileContent The full content of the file being processed
 * @return {Promise<string>} Contributors content in markdown format
 */
async function contributors({ content, options = {}, originalPath, currentFileContent }) {
  /** @type {ContributorsOptions & typeof defaults} */
  const opts = deepmerge(defaults, options)
  
  let repository = opts.repo
  
  // Auto-detect repository if not provided
  if (!repository) {
    const detectedRepo = await getRepositoryFromOrigin()
    if (!detectedRepo) {
      throw new Error('Repository not found. Please specify the "repo" option in format "owner/repo" or ensure you are in a git repository with a GitHub remote.')
    }
    repository = detectedRepo
  }
  
  // Validate repository format
  if (!repository.includes('/')) {
    throw new Error('Repository must be in format "owner/repo"')
  }
  
  // Prepare GitHub API options
  const githubOptions = {}
  
  // Use token from options or environment variable
  if (opts.token) {
    githubOptions.token = opts.token
  } else if (process.env.GITHUB_TOKEN) {
    githubOptions.token = process.env.GITHUB_TOKEN
  }
  
  try {
    // Fetch contributors from GitHub API
    const contributorsData = await new Promise((resolve, reject) => {
      githubContributors(repository, githubOptions, (err, contributors) => {
        if (err) {
          reject(err)
        } else {
          resolve(contributors)
        }
      })
    })
    
    if (!contributorsData || contributorsData.length === 0) {
      return 'No contributors found.'
    }
    
    return formatContributors(contributorsData, opts.format)
  } catch (error) {
    throw new Error(`Failed to fetch contributors for ${repository}: ${error.message}`)
  }
}

module.exports = contributors