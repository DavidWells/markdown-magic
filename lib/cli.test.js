const { test } = require('uvu') 
const assert = require('uvu/assert')
const { deepLog } = require('./utils/logs')
const { getGlobGroupsFromArgs, runCli } = require('./cli')

const DEBUG = true
const logger = (DEBUG) ? console.log : () => {}
const deepLogger = (DEBUG) ? deepLog : () => {}

function logInput(rawArgs) {
  logger('\n───────────────────────')
  logger('Input:')
  logger(rawArgs.join(" "))
  logger('───────────────────────\n')
}

test('Exports API', () => {
  assert.equal(typeof runCli, 'function', 'undefined val')
  assert.equal(typeof getGlobGroupsFromArgs, 'function', 'undefined val')
})

test.run()