const fs = require('fs')
const path = require('path')
const { parseBlocks } = require('../../src')
const { getTextBetweenChars, getBlockText, dedentString } = require('../../src/text')

const util = require('util')

let DEBUG = process.argv.includes('--debug') ? true : false
// DEBUG = true
const logger = DEBUG ? deepLog : () => {}

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


const yaml = fs.readFileSync(path.join(__dirname, '_yaml.yml'), 'utf8')

const details = parseBlocks(yaml, {
  syntax: 'yaml',
  open: 'block',
  close: '/block',
})

deepLog(details)

const block = details.blocks
console.log('Raw text between open and close tags')
console.log(getTextBetweenChars(yaml, block[0].block.start, block[0].block.end))

console.log('───────────────────────────────')
console.log('Full block text')
const getText = getBlockText(yaml, block[0].block)
console.log(getText)

console.log(getText === block[0].block.match)

console.log('───────────────────────────────')
console.log('Dedented block text')
const dedentText = dedentString(getText)
console.log(dedentText)