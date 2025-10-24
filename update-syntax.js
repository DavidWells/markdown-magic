const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function updateMarkdownFiles() {
  const files = await glob('**/*.md', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**'],
    absolute: true
  });

  console.log(`Found ${files.length} markdown files`);

  let updatedCount = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      // Replace all variations of doc-gen opening tags
      content = content.replace(/<!--\s*doc-gen/g, '<!-- docs');

      // Replace all variations of end-doc-gen closing tags
      content = content.replace(/<!--\s*end-doc-gen/g, '<!-- /docs');

      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nUpdated ${updatedCount} files`);
}

updateMarkdownFiles().catch(console.error);
