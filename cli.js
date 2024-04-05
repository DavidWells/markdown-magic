const mri = require('mri')
const { runCli } = require('./lib/cli')
const argv = process.argv.slice(2)
const cliArgs = mri(argv)

/*
console.log('Raw args:', argv)
console.log('Before args:', cliArgs)
/** */
runCli(cliArgs)
