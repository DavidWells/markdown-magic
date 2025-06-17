const fs = require('fs')
const path = require('path')
const findUp = require('find-up')
const semver = require('semver')

const defaults = {
  optional: 'false',
  dev: 'false',
  peers: 'false',
  production: 'false',
}

const npmPkgUrl = 'https://npmjs.org/package/'


function findPkg(dir) {
  const pkgPath = findUp.sync('package.json', { cwd: dir })
  if (!pkgPath) throw new Error('No package.json file found')
  return pkgPath
}

function sanitizeSemver(version, maxLength = 10, truncateStr = '...') {
  if (semver.valid(version)) return version

  const adjustedLength = maxLength - truncateStr.length

  return version.length > adjustedLength
    ? [version.substr(0, adjustedLength), truncateStr].join('')
    : version
}

function convertRepositoryToUrl(repository, name) {
  let repo = (repository.url ? repository.url : repository).replace('.git', '')

  if (repo.startsWith('http')) {
    return repo
  } else if (repo.startsWith('git://')) {
    return repo.replace('git://', 'https://')
  } else if (repo.startsWith('git+ssh')) {
    const [full, url] = repo.match(/^git\+ssh\:\/\/git\@(.*)$/)
    return [`https://`, url].join('')
  } else if (repo.startsWith('git@')) {
    return repo.replace('git@', 'https://').replace(':', '/')
  } else {
    return ['https://github.com/', repo].join('')
  }

  return repo
}

function getPkgUrl(pkg) {
  const { name, repository, homepage, bugs } = pkg

  if (homepage) return homepage
  if (repository) return convertRepositoryToUrl(repository, name)
  if (bugs) return bugs.url || bugs
  return `https://npmjs.org/package/${name}`
}

function sanitizeLicense(license) {
  return license ? license : 'UNLICENSED'
}

const readDependencies = (pkg) => (manifest, type) => {
  const dependencyType = type || 'production'
  let dependencies

  if (type === 'production') {
    dependencies = pkg.dependencies
  } else {
    dependencies = pkg[`${type}Dependencies`]
  }

  return manifest.concat(
    Object.keys(dependencies || {}).map((name) => {
      const localPkgPath = findUp.sync(`node_modules/${name}/package.json`)
      const localPkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf8'))
      const { description, homepage, version, repository, license } = localPkg

      return {
        name,
        semver: sanitizeSemver(dependencies[name]),
        version,
        description,
        url: getPkgUrl(localPkg),
        license: sanitizeLicense(license),
        dependencyType,
      }
    })
  )
}

function renderDependencies(dependency) {
  const { name, semver, version, license, description, url, dependencyType } =
    dependency

  return [
    '',
    `[${[name, semver].join('@')}](${url})`,
    description,
    version,
    license,
    dependencyType,
    '',
  ].join(' | ')
}

/**
 * ### > dependencyTable
 *
 * Generate a table of dependencies with links to their repositories, version information, and descriptions
 *
 * **Options:**
 * - `pkg` (optional): Relative path to package.json file. Default: auto-detected from current directory
 * - `production` (optional): Include production dependencies. Default `false`
 * - `dev` (optional): Include dev dependencies. Default `false` 
 * - `peer` (optional): Include peer dependencies. Default `false`
 * - `optional` (optional): Include optional dependencies. Default `false`
 *
 * **Example:**
 * ```md
 * <!-- doc-gen dependencyTable production=true dev=true -->
 * Dependency table will be generated here
 * <!-- end-doc-gen -->
 * ```
 *
 * Default `matchWord` is `doc-gen`
 *
 * ---
 * @param {string} content The current content of the comment block
 * @param {object} options The options passed in from the comment declaration
 * @param {string} originalPath The path of the file being processed
 * @return {string} Dependency table in markdown format
 */
function dependencyTable({ content, options = {}, originalPath }) {
  const opts = Object.assign({}, defaults, options)

  let pkgPath

  if (opts.pkg) {
    pkgPath = path.resolve(path.dirname(originalPath), opts.pkg)
  } else {
    pkgPath = findPkg(originalPath)
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  const headers = [
    '| **Dependency** | **Description** | **Version** | **License** | **Type** |',
    '| -------------- | --------------- | ----------- | ----------- | -------- |',
  ]

  const types = ['production', 'peer', 'optional', 'dev']

  const declaredTypes = types.filter((type) => opts[type] === 'true')

  const deps = (declaredTypes.length ? declaredTypes : types)
    .concat([''])
    .reduce(readDependencies(pkg), [])
    .map(renderDependencies)

  return headers.concat(deps).join('\n')
}

module.exports = dependencyTable