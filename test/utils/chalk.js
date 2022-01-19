const safeChalk = require('safe-chalk')

const debugIndex = process.argv.indexOf('--json')
const hasJsonFlag = debugIndex > -1

// If --json flag disable chalk colors
const DISABLE_COLORS = hasJsonFlag || process.env.NO_COLORS || process.env.DOCS_GEN

module.exports = safeChalk(DISABLE_COLORS)