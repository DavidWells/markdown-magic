const { generateToc } = require('../utils/toc')

module.exports = async function sectionToc(api) {
  // console.log("sectionToc", api)
  const { options, currentFileContent, srcPath, getBlockDetails } = api
  const opts = options || {}
  const subToc = await generateToc({
    options: {
      ...opts,
      // Set sub table of contents
      sub: true
    },
    fileContent: currentFileContent,
    srcPath,
    getBlockDetails: getBlockDetails
  })
  return subToc
}