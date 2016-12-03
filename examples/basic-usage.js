import markdownMagic from 'markdown-magic'
import path from 'path'

const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath)
