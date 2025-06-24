const { processFile } = require('./src')

async function testBasic() {
  console.log('Testing basic functionality...')
  
  const content = `
# Test Document

<!-- DOCS:START uppercase -->
hello world
<!-- DOCS:END -->

Some other content.
  `

  const options = {
    content,
    dryRun: true,
    transforms: {
      uppercase: (api) => {
        return api.content.toUpperCase()
      }
    }
  }

  try {
    const result = await processFile(options)
    console.log('✅ Test passed!')
    console.log('isChanged:', result.isChanged)
    console.log('transforms applied:', result.transforms.length)
    console.log('Updated content contains HELLO WORLD:', result.updatedContents.includes('HELLO WORLD'))
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

testBasic()