/**
 * Migration script to update markdown-magic syntax from doc-gen to docs
 *
 * This script was used to migrate the codebase from the old 'doc-gen' syntax
 * to the new 'docs' syntax. It serves as an example of how to use the
 * generic migration utilities.
 *
 * For creating custom migrations, see packages/block-migrator package
 */

const { migrateDocGenToDocs } = require('./packages/block-migrator/src/index')

async function updateMarkdownFiles() {
  console.log('Migrating doc-gen syntax to docs...\n');

  const result = await migrateDocGenToDocs({
    verbose: true
  });

  console.log(`\nMigration complete! Updated ${result.filesUpdated} of ${result.filesProcessed} files.`);
}

updateMarkdownFiles().catch(console.error);
