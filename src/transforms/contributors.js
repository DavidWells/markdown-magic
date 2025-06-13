const githubContributors = require('github-contributors')
const remoteOriginUrl = require('remote-origin-url')
const format = require('github-url-from-git')

/**
 * Options for configuring the contributors transform.
 * @typedef {Object} ContributorsTransformOptions  
 * @property {string} [repo] - The GitHub repository in the format 'owner/repo'. If not provided, will be auto-detected from git remote.
 * @property {string} [format="table"] - Output format: "table", "list", or "aligned". Default is "table".
 * @property {string} [id] - GitHub client ID for authentication (optional, can also use CLIENT_ID env var).
 * @property {string} [secret] - GitHub client secret for authentication (optional, can also use CLIENT_SECRET env var).
 * @example
   ```md
   <!-- doc-gen contributors -->
   contributors will be generated here
   <!-- end-doc-gen -->
   ```
 * @example
   ```md
   <!-- doc-gen contributors format=list -->
   contributors list will be generated here  
   <!-- end-doc-gen -->
   ```
 */

module.exports = async function contributors(api) {
  const { options, content } = api
  
  try {
    // Get repository information
    let repo = options.repo
    if (!repo) {
      // Auto-detect from git remote
      const gitRemote = await remoteOriginUrl()
      if (gitRemote && gitRemote.includes('github.com')) {
        const formatted = format(gitRemote)
        if (formatted) {
          repo = formatted.split('https://github.com/')[1]
        }
      }
    }
    
    if (!repo) {
      return 'Unable to detect GitHub repository. Please specify the `repo` option.'
    }
    
    // Setup GitHub authentication if provided
    const auth = {}
    const clientId = options.id || process.env.CLIENT_ID
    const clientSecret = options.secret || process.env.CLIENT_SECRET
    
    if (clientId && clientSecret) {
      auth.id = clientId
      auth.secret = clientSecret
    }
    
    // Fetch contributors
    const contributors = await new Promise((resolve, reject) => {
      githubContributors(repo, auth, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
    
    if (!contributors || contributors.length === 0) {
      return 'No contributors found for this repository.'
    }
    
    // Format output based on requested format
    const outputFormat = options.format || 'table'
    
    switch (outputFormat.toLowerCase()) {
      case 'list':
        return contributors
          .map(contributor => `* ${contributor.contributions} [${contributor.login}](${contributor.html_url})`)
          .join('\n')
          
      case 'aligned':
        const maxCommits = Math.max(...contributors.map(c => c.contributions.toString().length))
        const header = `${'COMMITS'.padEnd(maxCommits)} | CONTRIBUTOR\n${'-'.repeat(maxCommits)} | -----------`
        const rows = contributors
          .map(contributor => `${contributor.contributions.toString().padEnd(maxCommits)} ${contributor.login}`)
          .join('\n')
        return `${header}\n${rows}`
        
      case 'table':
      default:
        const tableHeader = '| **Commits** | **Contributor**<br/> |\n| --- | --- |'
        const tableRows = contributors
          .map(contributor => `| ${contributor.contributions} | [${contributor.login}](${contributor.html_url}) |`)
          .join('\n')
        return `${tableHeader}\n${tableRows}`
    }
    
  } catch (error) {
    console.error('Error fetching contributors:', error)
    return `Error fetching contributors: ${error.message}`
  }
}