const https = require('https')
const { exec } = require('child_process')
const { getTextBetweenLines } = require('../../utils/text')

const VALID_SLUG_REGEX = /^[A-Z-a-z0-9_-]*$/
const VALID_FILE_REGEX = /^[^;]*$/
const GITHUB_LINK_REGEX = /^(?:https:\/\/)?github\.com\/([^/\s]*)\/([^/\s]*)\/blob\/([^/\s]*)\/([^\s]*)/
const GITHUB_RAW_LINK_REGEX = /^(?:https:\/\/)?(?:raw\.)?githubusercontent\.com\/([^/\s]*)\/([^/\s]*)\/([^/\s]*)\/([^\s]*)/

function isGithubLink(str = '') {
  return isGithubRepoLink(str) || isGithubRawLink(str)
}

function isGithubRepoLink(str = '') {
  return GITHUB_LINK_REGEX.test(str)
}

function isGithubRawLink(str = '') {
  return GITHUB_RAW_LINK_REGEX.test(str)
}

function convertLinkToRaw(link) {
  if (!isGithubRepoLink(link)) return link
  return link.replace(GITHUB_LINK_REGEX, 'https://raw.githubusercontent.com/$1/$2/$3/$4')
}

function resolveGithubDetails(repoFilePath) {
  let parts
  if (isGithubRepoLink(repoFilePath)) {
    parts = repoFilePath.match(GITHUB_LINK_REGEX)
  }
  if (isGithubRawLink(repoFilePath)) {
    parts = repoFilePath.match(GITHUB_RAW_LINK_REGEX)
  }
  if (!parts) {
    return
  }
  const [ _match, repoOwner, repoName, branchOrRef, filePath ] = parts
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
  const token = resolveAccessToken(accessToken)
  const logger = (debug) ? console.log : () => {}
  const githubDetails = resolveGithubDetails(repoFilePath)
  if (!githubDetails) {
    throw new Error(`Invalid github link. "${repoFilePath}" is not a valid github link`)
  }

  logger(`Github File Details "${repoFilePath}"`, githubDetails)

  const payload = {
    ...githubDetails,
    accessToken: token
  }

  let errs = []

  /* Try raw request first */
  try {
    const fileContent = await getGitHubFileContentsRaw(payload)
    logger(`✅  GitHub file resolved via raw GET`)
    return returnCode(fileContent, githubDetails.range)
  } catch (err) {
    logger('❌  Unable to resolve GitHub raw content')
    errs.push(err)
  }

  /* Then try Github CLI or GitHub API */
  const githubFetcher = (!token) ? getGitHubFileContentsCli : getGitHubFileContentsApi
  try {
    const fileContent = await githubFetcher(payload)
    logger(`✅  GitHub file resolved via ${githubFetcher.name}`)
    return returnCode(fileContent, githubDetails.range)
  } catch (err) {
    logger(`❌ Unable to resolve GitHub file via ${githubFetcher.name}`)
    errs.push(err)
  }

  /* Then try API */
  try {
    const fileContent = await getGitHubFileContentsApi(payload)
    logger(`✅  GitHub file resolved via ${getGitHubFileContentsApi.name}`)
    return returnCode(fileContent, githubDetails.range)
  } catch (err) {
    logger(`❌ Unable to resolve GitHub file via ${githubFetcher.name}`)
    errs.push(err)
  }

  throw new Error(`Failed to fetch GitHub file "${repoFilePath}". \n${errs.forEach(err => err.message)}`)
}

function returnCode(fileContent, lines) {
  if (!lines) return fileContent
  const [startLine, endLine] =lines
  return getTextBetweenLines(fileContent, startLine, endLine)
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
function getGitHubFileContentsApi(options) {
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
    /*
    console.log('getGitHubFileContentsApi options', options)
    /** */
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

function getGitHubFileContentsRaw(options) {
  validateInputs(options)

  const {
    repoOwner,
    repoName,
    filePath,
    branch,
    accessToken
  } = options
  
  const [ _filePath, hash ] = filePath.split('#')
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'raw.githubusercontent.com',
      path: `/${repoOwner}/${repoName}/${branch}/${_filePath}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        ...(accessToken) ? { 'Authorization': `token ${accessToken}` } : {},
      }
    }
    /*
    console.log('getGitHubFileContentsRaw options', options)
    /** */
    const req = https.request(options, (res) => {
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

    req.on('error', error => {
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

function resolveAccessToken(accessToken) {
  if (typeof accessToken === 'string' && accessToken.match(/process\.env\./)) {
    return process.env[accessToken.replace('process.env.', '')]
  }
  return accessToken || process.env.GITHUB_ACCESS_TOKEN
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
  isGithubLink,
  isGithubRawLink,
  getGitHubFileContentsRaw,
  resolveGithubDetails,
  resolveGithubContents,
}