const { blockTransformer } = require('./src')
const deepLog = require('./test/utils/log')

// Example transforms
const transforms = {
  // Transform that uppercases content
  uppercase: async (api) => {
    console.log('api', api)
    return api.content.toUpperCase()
  },
  
  // Transform that adds a prefix
  prefix: async (api) => {
    const { options } = api
    return `${options.prefix || 'PREFIX: '}${api.content}`
  }
}

// Example markdown content with transform blocks
const content = `
# My Document

<!-- DOCS:START uppercase -->
This will be transformed to uppercase
<!-- DOCS:END -->

<!-- DOCS:START prefix {"prefix": "NOTE: "} -->
This will get a prefix
<!-- DOCS:END -->

Regular content that won't be transformed
`

// Process the content
async function runExample() {
  try {
    const result = await blockTransformer(content, {
      srcPath: 'example.md',
      outputPath: 'example.output.md',
      transforms,
      debug: true
    })

    console.log('result.updatedContents', result.updatedContents)

    // deepLog(result)

    console.log('Original content:', content)
    console.log('\nTransformed content:', result.updatedContents)
    console.log('\nTransform details:', {
      isChanged: result.isChanged,
      transformsApplied: result.transforms.length,
      missingTransforms: result.missingTransforms.length
    })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

runExample()
