const { test } = require('uvu');
const assert = require('uvu/assert');
const fs = require('fs');
const path = require('path');
const { migrateMarkdownFiles, migrateDocGenToDocs } = require('../src/index.js');

// Helper to create temp files
function createTempFixture(name, content) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

// Helper to cleanup temp files
function cleanupTemp() {
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Setup and teardown
test.before(() => {
  cleanupTemp();
});

test.after(() => {
  cleanupTemp();
});

// Test: Basic migration with regex replacement
test('should migrate files with regex replacements', async () => {
  const content = '<!-- doc-gen TRANSFORM -->\nOld content\n<!-- end-doc-gen -->';
  const filePath = createTempFixture('test1.md', content);

  const result = await migrateMarkdownFiles({
    pattern: 'test1.md',
    cwd: path.dirname(filePath),
    replacements: [
      { find: /<!--\s*doc-gen/g, replace: '<!-- docs' },
      { find: /<!--\s*end-doc-gen/g, replace: '<!-- /docs' }
    ],
    verbose: false
  });

  const updated = fs.readFileSync(filePath, 'utf8');
  assert.is(result.filesProcessed, 1);
  assert.is(result.filesUpdated, 1);
  assert.ok(updated.includes('<!-- docs TRANSFORM -->'));
  assert.ok(updated.includes('<!-- /docs -->'));
  assert.not.ok(updated.includes('doc-gen'));
});

// Test: String replacement
test('should handle string replacements', async () => {
  const content = 'Replace this old-word with new-word';
  const filePath = createTempFixture('test2.md', content);

  const result = await migrateMarkdownFiles({
    pattern: 'test2.md',
    cwd: path.dirname(filePath),
    replacements: [
      { find: 'old-word', replace: 'new-word' }
    ],
    verbose: false
  });

  const updated = fs.readFileSync(filePath, 'utf8');
  assert.is(result.filesUpdated, 1);
  assert.ok(updated.includes('new-word'));
  assert.not.ok(updated.includes('old-word'));
});

// Test: Dry run mode
test('should not modify files in dry run mode', async () => {
  const content = '<!-- doc-gen TEST -->';
  const filePath = createTempFixture('test3.md', content);

  const result = await migrateMarkdownFiles({
    pattern: 'test3.md',
    cwd: path.dirname(filePath),
    replacements: [
      { find: /doc-gen/g, replace: 'docs' }
    ],
    dryRun: true,
    verbose: false
  });

  const unchanged = fs.readFileSync(filePath, 'utf8');
  assert.is(result.filesUpdated, 1); // Reports it would update
  assert.ok(unchanged.includes('doc-gen')); // But file is unchanged
});

// Test: No changes needed
test('should report no updates when content does not match', async () => {
  const content = '# Just a regular markdown file';
  const filePath = createTempFixture('test4.md', content);

  const result = await migrateMarkdownFiles({
    pattern: 'test4.md',
    cwd: path.dirname(filePath),
    replacements: [
      { find: /doc-gen/g, replace: 'docs' }
    ],
    verbose: false
  });

  assert.is(result.filesProcessed, 1);
  assert.is(result.filesUpdated, 0);
});

// Test: Multiple replacements
test('should apply multiple replacement rules', async () => {
  const content = 'Replace foo and bar and baz';
  const filePath = createTempFixture('test5.md', content);

  await migrateMarkdownFiles({
    pattern: 'test5.md',
    cwd: path.dirname(filePath),
    replacements: [
      { find: 'foo', replace: 'FOO' },
      { find: 'bar', replace: 'BAR' },
      { find: 'baz', replace: 'BAZ' }
    ],
    verbose: false
  });

  const updated = fs.readFileSync(filePath, 'utf8');
  assert.ok(updated.includes('FOO'));
  assert.ok(updated.includes('BAR'));
  assert.ok(updated.includes('BAZ'));
});

// Test: Error handling - no replacements
test('should throw error when no replacements provided', async () => {
  try {
    await migrateMarkdownFiles({
      pattern: '*.md',
      replacements: []
    });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('replacement rule'));
  }
});

// Test: Error handling - invalid replacement rule
test('should throw error for invalid replacement rules', async () => {
  try {
    await migrateMarkdownFiles({
      pattern: '*.md',
      replacements: [
        { find: 'test' } // Missing replace property
      ]
    });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.ok(error.message.includes('find'));
  }
});

// Test: migrateDocGenToDocs convenience function
test('should migrate doc-gen to docs using convenience function', async () => {
  const content = '<!-- doc-gen FOO -->\nContent\n<!-- end-doc-gen -->';
  const filePath = createTempFixture('test6.md', content);

  const result = await migrateDocGenToDocs({
    pattern: 'test6.md',
    cwd: path.dirname(filePath),
    verbose: false
  });

  const updated = fs.readFileSync(filePath, 'utf8');
  assert.is(result.filesUpdated, 1);
  assert.ok(updated.includes('<!-- docs FOO -->'));
  assert.ok(updated.includes('<!-- /docs -->'));
});

// Test: Glob pattern matching
test('should process multiple files matching pattern', async () => {
  cleanupTemp(); // Clean before this test
  const tempDir = path.join(__dirname, 'temp');
  createTempFixture('file1.md', '<!-- doc-gen -->');
  createTempFixture('file2.md', '<!-- doc-gen -->');
  createTempFixture('file3.txt', '<!-- doc-gen -->'); // Should not match

  const result = await migrateMarkdownFiles({
    pattern: '*.md',
    cwd: tempDir,
    replacements: [
      { find: /doc-gen/g, replace: 'docs' }
    ],
    verbose: false
  });

  assert.is(result.filesProcessed, 2); // Only .md files
  assert.is(result.filesUpdated, 2);
});

// Test: Ignore patterns
test('should respect ignore patterns', async () => {
  cleanupTemp(); // Clean before this test
  const tempDir = path.join(__dirname, 'temp');
  const nodeModulesDir = path.join(tempDir, 'node_modules');
  fs.mkdirSync(nodeModulesDir, { recursive: true });

  createTempFixture('root.md', '<!-- doc-gen -->');
  fs.writeFileSync(path.join(nodeModulesDir, 'ignored.md'), '<!-- doc-gen -->', 'utf8');

  const result = await migrateMarkdownFiles({
    pattern: '**/*.md',
    cwd: tempDir,
    ignore: ['**/node_modules/**'],
    replacements: [
      { find: /doc-gen/g, replace: 'docs' }
    ],
    verbose: false
  });

  // Should only process root.md, not the one in node_modules
  assert.is(result.filesProcessed, 1);
});

// Test: Updated files list
test('should return list of updated files', async () => {
  const tempDir = path.join(__dirname, 'temp');
  createTempFixture('update1.md', '<!-- doc-gen -->');
  createTempFixture('update2.md', '<!-- doc-gen -->');
  createTempFixture('unchanged.md', 'No match here');

  const result = await migrateMarkdownFiles({
    pattern: '*.md',
    cwd: tempDir,
    replacements: [
      { find: /doc-gen/g, replace: 'docs' }
    ],
    verbose: false
  });

  assert.is(result.updatedFiles.length, 2);
  assert.ok(result.updatedFiles.some(f => f.includes('update1.md')));
  assert.ok(result.updatedFiles.some(f => f.includes('update2.md')));
  assert.not.ok(result.updatedFiles.some(f => f.includes('unchanged.md')));
});

test.run();
