import path from 'path'
import markdownMagic from 'markdown-magic'

const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
