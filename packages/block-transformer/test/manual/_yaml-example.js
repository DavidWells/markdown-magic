const { blockTransformer, indentString } = require('../../src')
const fs = require('fs')
const path = require('path')
const util = require('util')

function logValue(value, isFirst, isLast) {
  const prefix = `${isFirst ? '> ' : ''}`
  if (typeof value === 'object') {
    console.log(`${util.inspect(value, false, null, true)}\n`)
    return
  }
  if (isFirst) {
    console.log(`\n\x1b[33m${prefix}${value}\x1b[0m`)
    return
  }
  console.log((typeof value === 'string' && value.includes('\n')) ? `\`${value}\`` : value)
  // isLast && console.log(`\x1b[37m\x1b[1m${'─'.repeat(94)}\x1b[0m\n`)
}

function deepLog() {
  for (let i = 0; i < arguments.length; i++) logValue(arguments[i], i === 0, i === arguments.length - 1)
}

const yaml = `
name: Test Workflow
description: A simple test workflow for testing purposes
version: 1.0.0

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run tests
        run: npm test

      ## include file src="_test.yml" ##
      - name: Run tests two
        run: npm test two
      ## /include ##

      ## include js src="_run.js" ##
      - name: Run tests two
        run: npm test two
      ## /include ##

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Build project
        run: npm run build
`

blockTransformer(yaml, {
  syntax: 'yaml',
  open: 'include',
  close: '/include',
  transforms: {
    file: ({ content, options }) => {
      const { src } = options
      const blockContent = fs.readFileSync(path.join(__dirname, src), 'utf8')
      return blockContent
    },
    js: (api) => {
      console.log('api', api)
      const { content, options } = api
      console.log('XYZ', content)
      const jsContent = fs.readFileSync(path.join(__dirname, options.src), 'utf8')
      return `
- name: Run tests two
  run: |
${indentString(jsContent, 4)}
`
    }
  }
}).then(deepLog)