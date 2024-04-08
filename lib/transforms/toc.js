const { generateToc } = require('../utils/toc')

/**
 * Options for configuring the table of contents.
 * @typedef {Object} ToCTransformOptions
 * @property {boolean} [firsth1=false] - Show the first h1 of the document in the table of contents. Default is `false`.
 * @property {boolean} [collapse=false] - Collapse the table of contents in a detail accordion. Default is `false`.
 * @property {string} [collapseText] - Text for the summary of the table of contents accordion.
 * @property {string} [excludeText="Table of Contents"] - Text to exclude in the table of contents. Default is `Table of Contents`.
 * @property {number} [maxDepth=4] - Maximum depth of headings to include in the table of contents. Default is `4`.
 * @example
   ```md
   <!-- doc-gen (TOC) -->
   toc will be generated here
   <!-- end-doc-gen -->
   ``` 
 */

module.exports = async function TOC(api) {
  // console.log("TOC API", api)
  const { currentFileContent, srcPath, getBlockDetails } = api
  /** @type {ToCTransformOptions} */
  const options = api.options || {}
  const toc = await generateToc({
    options,
    srcPath,
    getBlockDetails: getBlockDetails,
    fileContent: currentFileContent,
  })
  return toc
}