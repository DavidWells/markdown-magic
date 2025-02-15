#!/usr/bin/env node
const mri = require('mri')
const { runCli } = require('./lib/cli')
const argv = process.argv.slice(2)
const cliArgs = mri(argv)

/*
console.log('Raw argv:', argv)
console.log('mri argv:', cliArgs)
// process.exit(1)
/** */
runCli(cliArgs, argv)
