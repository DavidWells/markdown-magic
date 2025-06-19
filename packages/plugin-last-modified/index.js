const { execSync } = require('child_process');
const path = require('path');

/**
 * Get the last modified date of a file using git
 * @param {string} filePath - Path to the file to check
 * @param {object} options - Options for git command
 * @param {string} options.format - Date format for git log command
 * @returns {string} Last modified date string
 */
function getLastModifiedDate(filePath, options = {}) {
  const { format = '%ad' } = options;
  
  try {
    // Get the last modification date using git log
    const gitCommand = `git log -1 --format="${format}" --date=format:"%B %d, %Y" -- "${filePath}"`;
    const result = execSync(gitCommand, { 
      encoding: 'utf8',
      cwd: path.dirname(filePath),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return result.trim();
  } catch (error) {
    // If git command fails, try to get file modification time as fallback
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.mtime.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (fsError) {
      return 'Unknown';
    }
  }
}

/**
 * ### > lastModified
 *
 * Add last modified date from git to markdown files
 *
 * **Options:**
 * - `file` (optional): Path to a different file to check modification date for. If not provided, uses the current file being processed
 * - `format` (optional): Date format string for git log command. Default `%ad`
 * - `prefix` (optional): Text to prepend to the output. Default `**Last modified:**`
 *
 * **Example:**
 * ```md
 * <!-- doc-gen lastModified -->
 * This will be replaced with the last modified date
 * <!-- end-doc-gen -->
 * ```
 *
 * **Example with custom file:**
 * ```md
 * <!-- doc-gen lastModified file="./other-file.md" -->
 * This will show the last modified date of other-file.md
 * <!-- end-doc-gen -->
 * ```
 *
 * ---
 * @param {string} content The current content of the comment block
 * @param {object} options The options passed in from the comment declaration
 * @param {string} options.file Optional path to check different file
 * @param {string} options.format Optional date format for git log
 * @param {string} options.prefix Optional prefix text
 * @param {string} srcPath The path to the current markdown file being processed
 * @return {string} Last modified date information
 */
function lastModified({ content, options = {}, srcPath }) {
  const { 
    file: customFile, 
    format = '%ad',
    prefix = '**Last modified:**'
  } = options;
  
  // Determine which file to check
  let targetFile;
  if (customFile) {
    // If a custom file is specified, resolve it relative to the current markdown file
    targetFile = path.resolve(path.dirname(srcPath), customFile);
  } else {
    // Use the current markdown file being processed
    targetFile = srcPath;
  }
  
  // Get the last modified date
  const lastModifiedDate = getLastModifiedDate(targetFile, { format });
  
  // Get relative path for display
  const relativePath = customFile || path.basename(srcPath);
  
  // Format the output
  return `${prefix} ${lastModifiedDate}`;
}

// Export both the plugin function and the utility function
module.exports = lastModified;
module.exports.getLastModifiedDate = getLastModifiedDate;