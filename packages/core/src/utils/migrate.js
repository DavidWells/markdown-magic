const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

/**
 * Migrate markdown files by applying a set of find-and-replace transformations
 * @param {Object} options - Migration options
 * @param {string} [options.pattern='**/*.md'] - Glob pattern for files to migrate
 * @param {string} [options.cwd=process.cwd()] - Current working directory
 * @param {string[]} [options.ignore=['**/node_modules/**']] - Patterns to ignore
 * @param {Array<{find: RegExp|string, replace: string}>} options.replacements - Array of replacement rules
 * @param {boolean} [options.verbose=true] - Whether to log progress
 * @param {boolean} [options.dryRun=false] - If true, don't write files, just report what would change
 * @returns {Promise<{filesProcessed: number, filesUpdated: number, updatedFiles: string[]}>} Migration results
 *
 * @example
 * // Migrate from old syntax to new syntax
 * const { migrateMarkdownFiles } = require('./migrate');
 *
 * await migrateMarkdownFiles({
 *   replacements: [
 *     { find: /<!--\s*doc-gen/g, replace: '<!-- docs' },
 *     { find: /<!--\s*end-doc-gen/g, replace: '<!-- /docs' }
 *   ]
 * });
 *
 * @example
 * // Dry run to see what would change
 * await migrateMarkdownFiles({
 *   pattern: 'docs/**/*.md',
 *   replacements: [
 *     { find: 'old-word', replace: 'new-word' }
 *   ],
 *   dryRun: true
 * });
 */
async function migrateMarkdownFiles(options = {}) {
  const {
    pattern = '**/*.md',
    cwd = process.cwd(),
    ignore = ['**/node_modules/**'],
    replacements = [],
    verbose = true,
    dryRun = false
  } = options;

  if (!replacements || replacements.length === 0) {
    throw new Error('At least one replacement rule must be provided');
  }

  // Validate replacement rules
  for (const rule of replacements) {
    if (!rule.find || rule.replace === undefined) {
      throw new Error('Each replacement rule must have "find" and "replace" properties');
    }
  }

  const files = await glob(pattern, {
    cwd,
    ignore,
    absolute: true
  });

  if (verbose) {
    console.log(`Found ${files.length} markdown files`);
  }

  let filesUpdated = 0;
  const updatedFiles = [];

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      // Apply all replacement rules
      for (const rule of replacements) {
        if (rule.find instanceof RegExp) {
          content = content.replace(rule.find, rule.replace);
        } else {
          // For string replacements, replace all occurrences
        } else {
          // For string replacements, replace all occurrences
          const escapedFind = escapeRegex(rule.find);
          const regex = new RegExp(escapedFind, 'g');
          content = content.replace(regex, rule.replace);
      }

      if (content !== originalContent) {
        if (!dryRun) {
          fs.writeFileSync(file, content, 'utf8');
        }
        filesUpdated++;
        updatedFiles.push(file);
        if (verbose) {
          console.log(`${dryRun ? '[DRY RUN] Would update' : 'Updated'}: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  if (verbose) {
    console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${filesUpdated} of ${files.length} files`);
  }

  return {
    filesProcessed: files.length,
    filesUpdated,
    updatedFiles
  };
}

/**
 * Escape special regex characters in a string
 * @private
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Migrate markdown files from doc-gen to docs syntax (common migration)
 * @param {Object} [options] - Migration options (same as migrateMarkdownFiles)
 * @returns {Promise<{filesProcessed: number, filesUpdated: number, updatedFiles: string[]}>} Migration results
 *
 * @example
 * // Migrate from doc-gen to docs syntax
 * const { migrateDocGenToDocs } = require('./migrate');
 * await migrateDocGenToDocs();
 */
async function migrateDocGenToDocs(options = {}) {
  return migrateMarkdownFiles({
    ...options,
    replacements: [
      { find: /<!--\s*doc-gen/g, replace: '<!-- docs' },
      { find: /<!--\s*end-doc-gen/g, replace: '<!-- /docs' }
    ]
  });
}

module.exports = {
  migrateMarkdownFiles,
  migrateDocGenToDocs,
};
