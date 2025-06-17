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
   * <!-- doc-gen TOC -->
   * toc will be generated here
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
   * <!-- doc-gen CODE src="./relative/path/to/code.js" -->
   * This content will be dynamically replaced with code from the file
   * <!-- end-doc-gen -->
   * ```
   *
   * ```md
   *  <!-- doc-gen CODE src="./relative/path/to/code.js" lines=22-44 -->
   *  This content will be dynamically replaced with code from the file lines 22 through 44
   *  <!-- end-doc-gen -->
   *  ```
   * 
   * Default `matchWord` is `doc-gen`
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
   *
   * **Example:**
   * ```md
   * <!-- doc-gen FILE src=./path/to/file -->
   * This content will be dynamically replaced from the local file
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
  FILE: file,
  /**
   * ### > REMOTE
   *
   * Get any remote Data and put in markdown
   *
   * **Options:**
   * - `url`: The URL of the remote content to pull in
   *
   * **Example:**
   * ```md
   * <!-- doc-gen REMOTE url=http://url-to-raw-md-file.md -->
   * This content will be dynamically replaced from the remote url
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
   * <!-- doc-gen fileTree src="./src" maxDepth=2 -->
   * file tree will be generated here
   * <!-- end-doc-gen -->
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
   * Default `matchWord` is `doc-gen`
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
   * <!-- doc-gen install -->
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
  install: install,
}

module.exports = transforms