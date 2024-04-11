const https = require('https')
const safe = require('safe-await')
const { exec } = require('child_process')
const { getTextBetweenLines } = require('../../utils/text')

const VALID_SLUG_REGEX = /^[A-Z-a-z0-9_-]*$/
const VALID_FILE_REGEX = /^[^;]*$/
const GITHUB_LINK_REGEX = /^(?:https:\/\/)?github\.com\/([^/\s]*)\/([^/\s]*)\/blob\/([^/\s]*)\/([^\s]*)/
const GITHUB_RAW_LINK_REGEX = /^(?:https:\/\/)?raw\.githubusercontent\.com\/([^/\s]*)\/([^/\s]*)\/([^/\s]*)\/([^\s]*)/

function resolveGithubLink(repoFilePath) {
  const matches = repoFilePath.match(GITHUB_LINK_REGEX)
  if (matches) {
    const [_match, repoOwner, repoName, branchOrRef, filePath ] = matches
    const [ filePathStart, hash ] = filePath.split('#')
    const result = {
      repoOwner,
      repoName,
      filePath: filePathStart,
    }
    if (isGitHash(branchOrRef)) {
      result.ref = branchOrRef
    } else {
      result.branch = branchOrRef
    }
    if (hash) {
      const range = parseLineRange(`#${hash}`)
      if (range) {
        result.range = range
      }
    }
    return result
  }
  const rawMatches = repoFilePath.match(GITHUB_RAW_LINK_REGEX)
  if (rawMatches) {
    const [_match, repoOwner, repoName, branchOrRef, filePath ] = rawMatches
    const [ filePathStart, hash ] = filePath.split('#')
    const result = {
      repoOwner,
      repoName,
      filePath: filePathStart,
    }
    if (isGitHash(branchOrRef)) {
      result.ref = branchOrRef
    } else {
      result.branch = branchOrRef
    }
    if (hash) {
      const range = parseLineRange(`#${hash}`)
      if (range) {
        result.range = range
      }
    }
    return result
  }
}

/**
 * Resolves the contents of a file from a GitHub repository.
 *
 * @param {Object}  options - The options for resolving the GitHub contents.
 * @param {string}  options.repoFilePath - The file path in the GitHub repository.
 * @param {string}  [options.accessToken] - The access token for authenticating with GitHub (optional).
 * @param {boolean} [options.debug = false] - Whether to enable debug logging (optional).
 * @returns {Promise<string>} - A promise that resolves to the contents of the file.
 * @throws {Error} - If the GitHub link is invalid or if the file fetch fails.
 */
async function resolveGithubContents({
  repoFilePath,
  accessToken,
  debug = false
}) {
  const logger = (debug) ? console.log : () => {}
  const linkInfo = resolveGithubLink(repoFilePath)
  logger('github link info', linkInfo)
  if (!linkInfo) {
    throw new Error(`Invalid github link. "${repoFilePath}" is not a valid github link`)
  }
  const githubFetcher = (accessToken) ? getGitHubFileContents : getGitHubFileContentsCli
  logger('github fetcher', githubFetcher.name)
  const payload = {
    ...linkInfo,
    accessToken
  }
  let [err, fileContent] = await safe(githubFetcher(payload))
  if (fileContent) {
    logger(`${githubFetcher.name} resolved contents`, fileContent)
  }
  
  if (!fileContent) {
    [err, fileContent] = await safe(getGitHubFileContents(payload))
  }

  if (fileContent) {
    if (linkInfo.range) {
      const [startLine, endLine] = linkInfo.range
      return getTextBetweenLines(fileContent, startLine, endLine)
    }
    return fileContent
  }
  throw new Error(`Failed to fetch file. ${err.message}`)
}

/**
 * Retrieves the contents of a file from a GitHub repository using the GitHub CLI.
 *
 * @param {Object} options - The options for retrieving the file contents.
 * @param {string} options.repoOwner - The owner of the GitHub repository.
 * @param {string} options.repoName - The name of the GitHub repository.
 * @param {string} options.filePath - The path to the file in the repository.
 * @param {string} [options.branch] - The branch name of the repository.
 * @param {string} [options.ref] - The ref of the repository.
 * @returns {Promise<string>} A promise that resolves with the decoded content of the file.
 * @throws {Error} If there is an error retrieving the file contents.
 */
async function getGitHubFileContentsCli(options) {
  validateInputs(options)
  const {
    repoOwner, 
    repoName,
    filePath, 
    branch,
    ref,
  } = options

  let flags = ''
  if (ref) {
    flags = `?ref=${ref}`
  }
  if (branch) {
    flags = `?ref=${branch}`
  }
  const command = `gh api repos/${repoOwner}/${repoName}/contents/${filePath}${flags}`
  /*
  console.log('command', command)
  /** */
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }
      const fileContent = JSON.parse(stdout).content;
      const decodedContent = decode(fileContent)
      return resolve(decodedContent)
    })
  })
}

/**
 * Retrieves the contents of a file from a GitHub repository via the github API
 *
 * @param {Object} options - The options for retrieving the file contents.
 * @param {string} options.repoOwner - The owner of the GitHub repository.
 * @param {string} options.repoName - The name of the GitHub repository.
 * @param {string} options.filePath - The path to the file in the repository.
 * @param {string} [options.branch] - The branch name to fetch the file from. If not provided, the default branch will be used.
 * @param {string} [options.ref] - The ref (commit SHA or branch name) to fetch the file from. If provided, it takes precedence over the branch.
 * @param {string} [options.accessToken] - The access token for authenticating the request (optional).
 * @returns {Promise<string>} A promise that resolves with the decoded contents of the file.
 * @throws {Error} If the file retrieval fails or the response status code is not 200.
 */
function getGitHubFileContents(options) {
  validateInputs(options)

  const {
    repoOwner, 
    repoName,
    filePath, 
    branch,
    ref,
    accessToken
  } = options

  let flags = ''
  if (ref) {
    flags = `?ref=${ref}`
  }
  if (branch) {
    flags = `?branch=${branch}`
  }
  const apiEndpoint = `/repos/${repoOwner}/${repoName}/contents/${filePath}${flags}`
  /*
  // console.log('apiEndpoint', apiEndpoint)
  /** */
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiEndpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        ...(accessToken) ? { 'Authorization': `token ${accessToken}` } : {},
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          const fileContent = JSON.parse(data).content
          const decodedContent = decode(fileContent)
          resolve(decodedContent)
        } else {
          reject(new Error(`Failed to fetch file. Status code: ${res.statusCode}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

/**
 * Validates the inputs for a repository operation.
 *
 * @param {Object}  inputs - The inputs for the repository operation.
 * @param {string}  inputs.repoOwner - The owner of the repository.
 * @param {string}  inputs.repoName - The name of the repository.
 * @param {string}  inputs.filePath - The file path.
 * @param {string}  [inputs.branch] - The branch name.
 * @param {string}  [inputs.ref] - The Git reference.
 * @throws {Error}  If any of the inputs are invalid.
 */
function validateInputs({
  repoOwner,
  repoName,
  filePath,
  branch,
  ref,
}) {
  if (!VALID_SLUG_REGEX.test(repoOwner)) {
    throw new Error(`Invalid repoOwner "${repoOwner}"`)
  }
  if (!VALID_SLUG_REGEX.test(repoName)) {
    throw new Error(`Invalid repoName "${repoName}"`)
  }
  if (!VALID_FILE_REGEX.test(filePath)) {
    throw new Error(`Invalid filePath "${filePath}"`)
  }
  if (branch && !VALID_FILE_REGEX.test(branch)) {
    throw new Error(`Invalid branch "${branch}"`)
  }
  if (ref && !isGitHash(ref)) {
    throw new Error(`Invalid ref "${ref}"`)
  }
}

function decode(fileContent) {
  return Buffer.from(fileContent, 'base64').toString('utf-8')
}

function isGitHash(str) {
  // Regular expression to match Git hashes
  const gitHashRegex = /^[vV]?[0-9a-fA-F]{40}$/
  return gitHashRegex.test(str)
}

function parseLineRange(lineRangeString) {
  const matches = lineRangeString.match(/#L(\d+)-L(\d+)/)
  if (!matches) return
  const startLine = parseInt(matches[1])
  const endLine = parseInt(matches[2])
  return [startLine, endLine]
}

module.exports = {
  resolveGithubLink,
  resolveGithubContents,
}