// Basic syntax test without requiring dependencies
const fs = require('fs')
const path = require('path')

async function runBasicTests() {
  console.log('Testing @markdown-magic/github-contributors plugin structure...')
  
  try {
    // Test 1: Package.json exists and is valid
    console.log('\n✓ Test 1: Testing package.json')
    const pkg = require('./package.json')
    if (!pkg.name || !pkg.version || !pkg.dependencies) {
      throw new Error('Package.json is missing required fields')
    }
    console.log(`  - Name: ${pkg.name}`)
    console.log(`  - Version: ${pkg.version}`)
    console.log(`  - Dependencies: ${Object.keys(pkg.dependencies).join(', ')}`)
    
    // Test 2: Index.js exists and has valid syntax
    console.log('\n✓ Test 2: Testing index.js syntax')
    const indexPath = path.join(__dirname, 'index.js')
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.js does not exist')
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf8')
    if (!indexContent.includes('module.exports')) {
      throw new Error('index.js does not export a module')
    }
    
    if (!indexContent.includes('async function contributors')) {
      throw new Error('index.js does not contain the main contributors function')
    }
    
    console.log('  - File exists and contains expected structure')
    
    // Test 3: JSDoc documentation exists
    console.log('\n✓ Test 3: Testing documentation')
    if (!indexContent.includes('/**') || !indexContent.includes('CONTRIBUTORS')) {
      throw new Error('index.js is missing JSDoc documentation')
    }
    console.log('  - JSDoc documentation found')
    
    console.log('\n✅ All basic structure tests passed!')
    console.log('\nNote: Integration tests require npm install to be run first.')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

runBasicTests()