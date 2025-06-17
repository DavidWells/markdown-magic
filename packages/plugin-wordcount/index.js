
function getWordCount(str = '') {
  return str.trim().split(/\s+/).length
}

/**
 * ### > wordcount
 *
 * Add word count to markdown files
 *
 * **Options:**
 * - `useBlock` (optional): Use the contents of markdown block instead of the full file content for word count. Default `false`
 *
 * **Example:**
 * ```md
 * <!-- doc-gen wordcount -->
 * This will be replaced with the total word count
 * <!-- end-doc-gen -->
 * ```
 *
 * ---
 * @param {string} content The current content of the comment block
 * @param {object} options The options passed in from the comment declaration
 * @param {string} currentFileContent The entire file content
 * @return {string} Word count as string
 */
function wordcount({ content, options = {}, currentFileContent }) {
  const { useBlock = false } = options
  const textToCount = useBlock ? content : currentFileContent
  return getWordCount(textToCount).toString()
}

module.exports = wordcount