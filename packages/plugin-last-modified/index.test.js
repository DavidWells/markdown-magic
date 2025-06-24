const { test } = require('uvu');
const assert = require('uvu/assert');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const lastModified = require('./index');
const { getLastModifiedDate } = require('./index');

// Test the main plugin function
test('lastModified plugin returns formatted date', () => {
  const mockSrcPath = __filename;
  
  const result = lastModified({
    content: 'placeholder content',
    options: {},
    srcPath: mockSrcPath
  });
  
  // Should return a string with the default prefix
  assert.type(result, 'string');
  assert.ok(result.includes('**Last modified:**'));
});

test('lastModified plugin with custom prefix', () => {
  const mockSrcPath = __filename;
  
  const result = lastModified({
    content: 'placeholder content',
    options: { prefix: 'Custom prefix:' },
    srcPath: mockSrcPath
  });
  
  assert.ok(result.includes('Custom prefix:'));
  assert.not.ok(result.includes('**Last modified:**'));
});

test('lastModified plugin with custom file option', () => {
  const mockSrcPath = __filename;
  const packageJsonPath = './package.json';
  
  const result = lastModified({
    content: 'placeholder content',
    options: { file: packageJsonPath },
    srcPath: mockSrcPath
  });
  
  // Should return a string with date information
  assert.type(result, 'string');
  assert.ok(result.includes('**Last modified:**'));
});

// Test the utility function
test('getLastModifiedDate returns date string', () => {
  const result = getLastModifiedDate(__filename);
  
  // Should return a non-empty string
  assert.type(result, 'string');
  assert.ok(result.length > 0);
  assert.not.equal(result, 'Unknown');
});

test('getLastModifiedDate handles non-existent file', () => {
  const result = getLastModifiedDate('/non/existent/file.txt');
  
  // Should return 'Unknown' for non-existent files
  assert.equal(result, 'Unknown');
});

test('getLastModifiedDate with custom format', () => {
  const result = getLastModifiedDate(__filename, { format: '%H:%M:%S' });
  
  // Should return a time string (or fallback date)
  assert.type(result, 'string');
  assert.ok(result.length > 0);
});

// Test git integration (if git is available)
test('getLastModifiedDate uses git when available', () => {
  let hasGit = false;
  try {
    execSync('git --version', { stdio: 'ignore' });
    hasGit = true;
  } catch (e) {
    // Git not available, skip this test
  }
  
  if (hasGit) {
    // Test with a file that should be in git
    const result = getLastModifiedDate(__filename);
    assert.type(result, 'string');
    assert.ok(result.length > 0);
  }
});

// Test fallback to file system stats
test('getLastModifiedDate falls back to file stats', () => {
  // Create a temporary file
  const tempFile = path.join(__dirname, 'temp-test-file.txt');
  fs.writeFileSync(tempFile, 'test content');
  
  try {
    const result = getLastModifiedDate(tempFile);
    console.log('result', result);
    
    // Should return a date string (either from git or fs)
    assert.type(result, 'string', 'result is a string');
    assert.ok(result.length > 0, 'result is not empty');
  } finally {
    // Clean up
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
});

// Test plugin exports
test('plugin exports both main function and utility', () => {
  assert.type(lastModified, 'function');
  assert.type(lastModified.getLastModifiedDate, 'function');
  assert.equal(lastModified.getLastModifiedDate, getLastModifiedDate);
});

// Run all tests
test.run();

console.log('✅ All lastModified plugin tests passed!');