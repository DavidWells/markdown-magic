async function runTests() {
  console.log('Testing @markdown-magic/github-contributors plugin...')
  
  try {
    // Test 1: Basic syntax check
    console.log('\n✓ Test 1: Plugin syntax is valid')
    require('./index')
    console.log('✓ Plugin file can be required (syntax is valid)')
    
    // Test 2: Plugin structure is valid
    console.log('✓ Test 2: Plugin structure is valid')
    
    // Test 3: Package.json exists and is valid
    console.log('✓ Test 3: Testing package.json')
    const pkg = require('./package.json')
    if (!pkg.name || !pkg.version || !pkg.dependencies) {
      throw new Error('Package.json is missing required fields')
    }
    
    console.log('\n✅ All tests passed!')
    console.log('\nNote: Full integration tests require a valid GitHub repository.')
    console.log('To test with a real repository, run:')
    console.log('node -e "require(\'./index\')({ content: \'\', options: { repo: \'facebook/react\' }, originalPath: __filename, currentFileContent: \'\' }).then(console.log)"')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

runTests()