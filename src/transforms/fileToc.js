const fs = require('fs')
const path = require('path')

/**
 * Options for configuring the file tree table of contents.
 * @typedef {Object} FileTocTransformOptions
 * @property {string} [src="."] - The directory path to generate the file tree for. Default is `.` (current directory).
 * @property {number} [maxDepth=3] - Maximum depth to traverse in the directory tree. Default is `3`.
 * @property {boolean} [includeFiles=true] - Whether to include files in the tree or just directories. Default is `true`.
 * @property {string[]} [exclude=[]] - Array of glob patterns to exclude from the tree.
 * @property {boolean} [showSize=false] - Whether to show file sizes. Default is `false`.
 * @property {string} [format="tree"] - Output format: "tree" or "list". Default is `"tree"`.
 * @example
   ```md
   <!-- doc-gen FILETOC src="./src" maxDepth=2 -->
   file tree will be generated here
   <!-- end-doc-gen -->
   ``` 
 */

/**
 * Generate a file tree table of contents
 * @param {Object} api - The markdown-magic API object
 * @returns {string} The generated file tree markdown
 */
module.exports = function FILETOC(api) {
  const { options, srcPath } = api
  /** @type {FileTocTransformOptions} */
  const opts = options || {}
  
  const targetPath = opts.src || '.'
  const maxDepth = opts.maxDepth ? Number(opts.maxDepth) : 3
  const includeFiles = opts.includeFiles !== false
  const exclude = opts.exclude || []
  const showSize = opts.showSize === true
  const format = opts.format || 'tree'
  
  // Resolve the target path relative to the source file
  const fileDir = path.dirname(srcPath)
  const resolvedPath = path.resolve(fileDir, targetPath)
  
  try {
    const tree = generateFileTree(resolvedPath, {
      maxDepth,
      includeFiles,
      exclude,
      showSize,
      currentDepth: 0
    })
    
    if (format === 'list') {
      return formatAsList(tree)
    }
    
    return formatAsTree(tree)
  } catch (error) {
    console.error(`Error generating file tree for ${resolvedPath}:`, error.message)
    return `<!-- Error: Could not generate file tree for ${targetPath} -->`
  }
}

/**
 * Generate file tree structure
 * @param {string} dirPath - Directory path to scan
 * @param {Object} options - Options for tree generation
 * @returns {Object} Tree structure
 */
function generateFileTree(dirPath, options) {
  const { maxDepth, includeFiles, exclude, showSize, currentDepth } = options
  
  if (currentDepth >= maxDepth) {
    return { type: 'directory', name: path.basename(dirPath), children: [], truncated: true }
  }
  
  let items
  try {
    items = fs.readdirSync(dirPath)
  } catch (error) {
    return { type: 'directory', name: path.basename(dirPath), children: [], error: true }
  }
  
  // Filter out excluded items
  items = items.filter(item => {
    // Skip hidden files and common ignored directories
    if (item.startsWith('.') && !item.match(/\.(md|txt|json)$/)) {
      return false
    }
    if (['node_modules', '.git', '.DS_Store', 'dist', 'build'].includes(item)) {
      return false
    }
    
    // Apply custom exclude patterns
    return !exclude.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(item)
    })
  })
  
  const children = []
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stats = fs.statSync(itemPath)
    
    if (stats.isDirectory()) {
      const subTree = generateFileTree(itemPath, {
        ...options,
        currentDepth: currentDepth + 1
      })
      children.push(subTree)
    } else if (includeFiles) {
      children.push({
        type: 'file',
        name: item,
        size: showSize ? stats.size : undefined
      })
    }
  }
  
  // Sort: directories first, then files, alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
  
  return {
    type: 'directory',
    name: path.basename(dirPath) || path.basename(path.resolve(dirPath)),
    children
  }
}

/**
 * Format tree as ASCII tree structure
 * @param {Object} tree - Tree structure
 * @returns {string} Formatted tree
 */
function formatAsTree(tree) {
  const lines = []
  
  function traverse(node, prefix = '', isLast = true) {
    const connector = isLast ? '└── ' : '├── '
    const name = node.type === 'directory' ? `${node.name}/` : node.name
    const size = node.size ? ` (${formatBytes(node.size)})` : ''
    
    lines.push(`${prefix}${connector}${name}${size}`)
    
    if (node.children && node.children.length > 0) {
      const extension = isLast ? '    ' : '│   '
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1
        traverse(child, prefix + extension, childIsLast)
      })
    }
    
    if (node.truncated) {
      const extension = isLast ? '    ' : '│   '
      lines.push(`${prefix}${extension}...`)
    }
  }
  
  traverse(tree)
  
  return '```\n' + lines.join('\n') + '\n```'
}

/**
 * Format tree as a list
 * @param {Object} tree - Tree structure
 * @returns {string} Formatted list
 */
function formatAsList(tree) {
  const lines = []
  
  function traverse(node, depth = 0) {
    const indent = '  '.repeat(depth)
    const name = node.type === 'directory' ? `**${node.name}/**` : node.name
    const size = node.size ? ` *(${formatBytes(node.size)})*` : ''
    
    lines.push(`${indent}- ${name}${size}`)
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverse(child, depth + 1)
      })
    }
    
    if (node.truncated) {
      lines.push(`${indent}  - ...`)
    }
  }
  
  traverse(tree)
  
  return lines.join('\n')
}

/**
 * Format bytes as human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}