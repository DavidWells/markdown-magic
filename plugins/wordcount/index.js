const { getWordCount } = require('../../src/utils/text')

/**
 * ### > wordcount
 *
 * Add word count to markdown files
 *
 * **Options:**
 * - `useFile` (optional): Use the entire file content for word count instead of just comment block content. Default `true`
 *
 * **Example:**
 * ```md
 * <!-- doc-gen wordcount -->
 * This will be replaced with the total word count
 * <!-- end-doc-gen -->
 * ```
 *
 * Default `matchWord` is `doc-gen`
 *
 * ---
 * @param {string} content The current content of the comment block
 * @param {object} options The options passed in from the comment declaration
 * @param {string} currentFileContent The entire file content
 * @return {string} Word count as string
 */
function wordcount({ content, options = {}, currentFileContent }) {
  const { useFile = true } = options
  const textToCount = useFile ? currentFileContent : content
  return getWordCount(textToCount).toString()
}

module.exports = wordcount