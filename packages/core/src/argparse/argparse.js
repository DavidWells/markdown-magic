const { dxParse } = require('@davidwells/dx-args')

if (require.main === module) {
  const result = dxParse(process.argv.slice(2))
  const util = require('util')
  console.log(util.inspect(result, false, null, true))
}

module.exports = {
  dxParse,
}
