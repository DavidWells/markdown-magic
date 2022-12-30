const { generateToc } = require('../utils/toc')

module.exports = async function TOC(api) {
  // console.log("TOC API", api)
  const { options, fileContent, srcPath, getBlockDetails } = api
  const toc = await generateToc({
    options: options || {},
    fileContent,
    srcPath,
    getBlockDetails: getBlockDetails
  })
  return toc
}