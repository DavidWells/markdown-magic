import markdownSteriods from 'markdown-steriods'
import path from 'path'

const config = {} // optional
const markdownPath = path.join(__dirname, 'README.md')
markdownSteriods(markdownPath, config)