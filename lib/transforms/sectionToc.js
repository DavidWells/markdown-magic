const { generateToc } = require('../utils/toc')

module.exports = async function sectionToc(api) {
  // console.log("sectionToc", api)
  const { options, fileContent, srcPath, getBlockDetails } = api
  const opts = options || {}
  const subToc = await generateToc({
    options: {
      ...opts,
      // Set sub table of contents
      sub: true
    },
    fileContent,
    srcPath,
    getBlockDetails: getBlockDetails
  })
  return subToc
}