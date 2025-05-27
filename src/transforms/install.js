const fs = require('fs')
const path = require('path')

/**
 * ### > INSTALL
 *
 * Generate installation instructions in a markdown table format
 *
 * **Options:**
 * - `packageName` (optional): The name of the package to install. If not provided, will try to read from package.json
 *
 * **Example:**
 * ```md
 * <!-- doc-gen INSTALL packageName=my-package -->
 * Installation instructions will be generated here
 * <!-- end-doc-gen -->
 * ```
 *
 * Default `matchWord` is `doc-gen`
 *
 * ---
 * @param {string} content The current content of the comment block
 * @param {object} options The options passed in from the comment declaration
 * @return {string} Updated content to place in the content block
 */
function install(api) {
  const { options } = api
  const { isDev = false } = options
  let packageName = options.packageName

  // If no package name provided, try to read from package.json
  if (!packageName) {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      packageName = packageJson.name
    } catch (error) {
      console.log('Could not read package.json:', error.message)
      return 'Error: No package name provided and could not read from package.json'
    }
  }

  let header = '# Installation'
  if (options.header) {
    header = (options.header.startsWith('#')) ? options.header : `# ${options.header}`
  }
  header = `${header}\n\n`

  if (options.header === false) {
    header = ''
  }

  let body = `Install the \`${packageName}\` cli using your favorite package manager.`
  if (options.body) {
    body = (options.body.startsWith('\n')) ? options.body : `\n${options.body}`
  }
  body = `${body}\n`

  if (options.body === false) {
    body = ''
  }

  if (!packageName) {
    return 'Error: No package name provided'
  }

  const flag = isDev ? ' -D' : ' '
  const space = isDev ? '  ' : ''

  return `${header}${body}
| package manager | command |
| --------------- | ------- |
| npm  | \`npm install ${packageName}${flag}\` |
| pnpm | \`pnpm add ${packageName}${flag}\`    |
| yarn | \`yarn add ${packageName}${flag}\`    |
| bun  | \`bun install ${packageName}\`${space}  |`
}

module.exports = install
