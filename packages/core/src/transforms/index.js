const code = require('./code')
const file = require('./file')
const fileTree = require('./fileTree')
const remoteContent = require('./remote')
const toc = require('./toc')
const sectionToc = require('./sectionToc')
const install = require('./install')

const transforms = {
  /**
   * ### > TOC
   *
   * Generate table of contents from markdown file
   *
   * **Options:**
   * - `firstH1` - *boolean* - (optional): Show first h1 of doc in table of contents. Default `false`
   * - `collapse` - *boolean* - (optional): Collapse the table of contents in a detail accordion. Default `false`
   * - `collapseText` - *string* - (optional): Text the toc accordion summary
   * - `excludeText` - *string* - (optional): Text to exclude in the table of contents. Default `Table of Contents`
   * - `maxDepth` - *number* - (optional): Max depth of headings. Default 4
   *
   * **Example:**
   * ```md
   * <!-- docs TOC -->
   * toc will be generated here
   * <!-- /docs -->
   * ```
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  TOC: toc,
  sectionToc: sectionToc,
  /**
   * ### > CODE
   *
   * Get code from file or URL and put in markdown
   *
   * **Options:**
   * - `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
   * - `syntax` (optional): Syntax will be inferred by fileType if not specified
   * - `header` (optional): Will add header comment to code snippet. Useful for pointing to relative source directory or adding live doc links
   * - `lines` (optional): a range with lines of code which will then be replaced with code from the file. The line range should be defined as: "lines=*startLine*-*EndLine*" (for example: "lines=22-44"). Please see the example below
   *
   * **Example:**
   * ```md
   * <!-- docs CODE src="./relative/path/to/code.js" -->
   * This content will be dynamically replaced with code from the file
   * <!-- /docs -->
   * ```
   *
   * ```md
   *  <!-- docs CODE src="./relative/path/to/code.js" lines=22-44 -->
   *  This content will be dynamically replaced with code from the file lines 22 through 44
   *  <!-- /docs -->
   *  ```
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated inner contents of the comment block
   */
  CODE: code,
  /**
   * ### > FILE
   *
   * Get local file contents.
   *
   * **Options:**
   * - `src`: The relative path to the file to pull in
   * - `sections`: Comma-separated list or array of markdown section headings to include
   * - `section`: Single markdown section heading to include
   * - `headings`: Array of markdown heading levels to include, such as `headings={[2,3]}`
   * - `removeLeadingH1`: Remove the first H1 from imported markdown
   * - `shiftHeaders`: Shift imported markdown headings up or down by a number
   *
   * **Example:**
   * ```md
   * <!-- docs FILE src=./path/to/file -->
   * This content will be dynamically replaced from the local file
   * <!-- /docs -->
   * ```
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  FILE: file,
  /**
   * ### > REMOTE
   *
   * Get any remote Data and put in markdown
   *
   * **Options:**
   * - `url`: The URL of the remote content to pull in
   * - `src`: Alias for `url`
   * - `githubToken`: Optional token value for private GitHub files. Only used when private GitHub reads are enabled.
   * - `useGhCli`: For GitHub URLs, allow fallback to `gh api` when private GitHub reads are enabled. Default: `true`
   * - `preferGhCli`: Try `gh api` before the GitHub contents API. Default: `false`
   * - `sections`: Comma-separated list or array of markdown section headings to include
   * - `section`: Single markdown section heading to include
   * - `headings`: Array of markdown heading levels to include, such as `headings={[2,3]}`
   * - `removeLeadingH1`: Remove the first H1 from imported markdown
   * - `shiftHeaders`: Shift imported markdown headings up or down by a number
   *
   * **Example:**
   * ```md
   * <!-- docs REMOTE url=http://url-to-raw-md-file.md -->
   * This content will be dynamically replaced from the remote url
   * <!-- /docs -->
   * ```
   *
   * GitHub `blob` and `raw.githubusercontent.com` file URLs are resolved with
   * GitHub-aware fallbacks. Public files use anonymous raw GitHub content first.
   * Private files are opt-in and can be fetched with `GITHUB_ACCESS_TOKEN`,
   * `GITHUB_TOKEN`, `githubToken`, or an authenticated GitHub CLI session only
   * when `allowPrivateGithub` is enabled.
   *
   * ```md
   * <!-- docs REMOTE
   *   src='https://github.com/owner/private-repo/blob/main/README.md'
   *   removeLeadingH1
   * -->
   * Existing content is kept if failOnMissingRemote is false.
   * <!-- /docs -->
   * ```
   *
   * Enable private GitHub reads from config:
   *
   * ```js
   * module.exports = {
   *   allowPrivateGithub: true
   * }
   * ```
   *
   * Or for a single CLI run:
   *
   * ```bash
   * md-magic --allow-private-github --files README.md
   * ```
   *
   * Run `gh auth status` before relying on local GitHub CLI auth. Set
   * `MARKDOWN_MAGIC_GH_CLI=0` to disable `gh api` fallback in CI or locked-down
   * environments.
   *
   * Remote requests are logged once per unique URL as they are attempted. Set
   * `logRemoteRequests: false` in config to disable this output.
   *
   * Successful remote responses are cached outside the project in the user's OS
   * cache directory by default. Normal responses are reused for 5 minutes.
   * GitHub files pinned to a full 40-character commit SHA use a longer immutable
   * cache TTL. Set `remoteCache: false` or `remoteCache: { enabled: false }` to
   * disable the cache, or pass `--no-cache` / `--no-remote-cache` for a single
   * CLI run. Set `remoteCache.cachePrivate: false` to avoid persisting
   * authenticated private GitHub responses to disk. Cache hits are logged as
   * `Getting remote (from cache):` unless `remoteCache.logHits` or
   * `logRemoteRequests` is disabled.
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  REMOTE: remoteContent,
  /**
   * ### > fileTree
   *
   * Generate a file tree table of contents
   *
   * **Options:**
   * - `src` (optional): The directory path to generate the file tree for. Default `.` (current directory)
   * - `maxDepth` (optional): Maximum depth to traverse in the directory tree. Default `3`
   * - `includeFiles` (optional): Whether to include files in the tree or just directories. Default `true`
   * - `exclude` (optional): Array of glob patterns to exclude from the tree. Default `[]`
   * - `showSize` (optional): Whether to show file sizes. Default `false`
   * - `format` (optional): Output format: "tree" or "list". Default `"tree"`
   *
   * **Example:**
   * ```md
   * <!-- docs fileTree src="./src" maxDepth=2 -->
   * file tree will be generated here
   * <!-- /docs -->
   * ```
   *
   * **Example Output (tree format):**
   * ```
   * └── src/
   *     ├── transforms/
   *     │   ├── code/
   *     │   │   ...
   *     │   ├── fileTree.js
   *     │   ├── index.js
   *     │   └── toc.js
   *     ├── utils/
   *     │   ├── fs.js
   *     │   ├── logs.js
   *     │   └── text.js
   *     └── index.js
   * ```
   *
   * **Example Output (list format):**
   * ```md
   * - **src/**
   *   - **transforms/**
   *     - **code/**
   *       - ...
   *     - fileTree.js
   *     - index.js
   *     - toc.js
   *   - **utils/**
   *     - fs.js
   *     - logs.js
   *     - text.js
   *   - index.js
   * ```
   *
   * **Example with file sizes:**
   * ```
   * └── src/
   *     ├── index.js (15.2 KB)
   *     └── package.json (552 B)
   * ```
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  fileTree: fileTree,
  /**
   * ### > install
   *
   * Generate installation instructions in a markdown table format
   *
   * **Options:**
   * - `packageName` (optional): The name of the package to install. If not provided, will try to read from package.json
   * - `isDev` (optional): Whether to install the package as a dev dependency. Default `false`
   * - `header` (optional): The header to use for the installation instructions. Default `# Installation`
   * - `body` (optional): The body to use for the installation instructions. Default `Install the \`${packageName}\` cli using your favorite package manager.`
   *
   * **Example:**
   * ```md
   * <!-- docs install -->
   * Installation instructions will be generated here
   * <!-- /docs -->
   * ```
   *
   * Default `matchWord` is `docs`
   *
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  install: install,
}

module.exports = transforms
