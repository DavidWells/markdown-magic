import path from 'path'
import markdownMagic from 'markdown-magic'

// Process a Single File
const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)