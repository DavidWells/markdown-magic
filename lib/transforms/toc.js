const { generateToc } = require('../utils/toc')

module.exports = async function TOC(api) {
  // console.log("TOC API", api)
  const { options, currentFileContent, srcPath, getBlockDetails } = api
  const toc = await generateToc({
    options: options || {},
    fileContent: currentFileContent,
    srcPath,
    getBlockDetails: getBlockDetails
  })
  return toc
}