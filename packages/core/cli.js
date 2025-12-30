#!/usr/bin/env node
// @ts-ignore
const mri = require('mri')
const { runCli } = require('./src/cli-run')
const argv = process.argv.slice(2)
const cliArgs = mri(argv)

/*
console.log('Raw argv:', argv)
console.log('mri argv:', cliArgs)
// process.exit(1)
/** */
runCli(cliArgs, argv)
