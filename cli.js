const mri = require('mri')
const { runCli } = require('./lib/cli')
const argv = process.argv.slice(2)
const cliArgs = mri(argv)

runCli(cliArgs)

