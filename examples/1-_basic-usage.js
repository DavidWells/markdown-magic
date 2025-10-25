import path from 'path'
import { markdownMagic } from '../packages/core/src/index.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Process a Single File
const markdownPath = path.join(__dirname, 'README.md')
markdownMagic(markdownPath).then((result) => {
  console.log('result', result)
})