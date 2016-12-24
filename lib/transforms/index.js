const code = require('./code')
const remoteContent = require('./remote')
const toc = require('./toc')

const transforms = {
  /**
   * ### `CODE`
   *
   * Get code from file or URL and put in markdown
   *
   * **Options:**
   * - `src`: The relative path to the code to pull in, or the `URL` where the raw code lives
   * - `syntax` (optional): Syntax will be inferred by fileType if not specified
   *
   * **Example:**
   * ```md
   * <-- MATCHWORD:START (CODE:src=./relative/path/to/code.js) -->
   * This content will be dynamically replaced with code from the file
   * <-- MATCHWORD:END -->
   * ```
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated inner contents of the comment block
   */
  CODE: code,
  /**
   * ### `REMOTE`
   *
   * Get any remote Data and put in markdown
   *
   * **Options:**
   * - `url`: The URL of the remote content to pull in
   *
   * **Example:**
   * ```md
   * <-- MATCHWORD:START (REMOTE:url=http://url-to-raw-md.md) -->
   * This content will be dynamically replace from the remote url
   * <-- MATCHWORD:END -->
   * ```
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  REMOTE: remoteContent,
  /**
   * ### `TOC`
   *
   * Generate table of contents from markdown file
   *
   * **Options:**
   * - `firsth1` - *Boolean* - (optional): Show first h1 of doc in table of contents. Default `false`
   *
   * **Example:**
   * ```md
   * <-- MATCHWORD:START (TOC) -->
   * toc will be generated here
   * <-- MATCHWORD:END -->
   * ```
   * ---
   * @param {string} content The current content of the comment block
   * @param {object} options The options passed in from the comment declaration
   * @return {string} Updated content to place in the content block
   */
  TOC: toc
}

module.exports = transforms
