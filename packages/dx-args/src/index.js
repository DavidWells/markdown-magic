#!/usr/bin/env node

const { dxParse } = require('./argparse/argparse')
const globparse = require('./globparse')
const { splitOutsideQuotes } = require('./argparse/splitOutsideQuotes')

if (require.main === module) {
  const result = dxParse(process.argv.slice(2))
  const util = require('util')
  console.log(util.inspect(result, false, null, true))
}

module.exports = {
  dxParse,
  splitOutsideQuotes,
  ...globparse,
}
