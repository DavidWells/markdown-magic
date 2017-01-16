#!/usr/bin/env node

const program = require('commander')
const pkg = require('./package.json')
const markdownMagic = require('./index')
const defaultFileName = 'README.md'

// start commander.js
program
  .version(pkg.version)
  .option('-p, --path [path]', 'Define path', parsePaths, defaultFileName)
  .parse(process.argv)

// console.log(program)

function parsePaths(path, defaultValue) {
  if (path) {
    processFile(path)
  }
}

// process default
if (program.path) {
  processFile(program.path)
}

function defaultCallback(err, msg) {
  if (err) {
    console.log('Error:', err)
  }
  if (msg) {
    console.log('files processed')
  }
}

function processFile(path, opts, cb) {
  const options = opts || {}
  const callback = cb || defaultCallback
  markdownMagic(path, options, callback)
}
