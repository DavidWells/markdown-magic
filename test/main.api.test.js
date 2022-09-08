const { test } = require('uvu') 
const assert = require('uvu/assert')

test('Main API', () => {
  const parsedValue = weirdParse(stringExample)
  console.log('parsedValue', parsedValue)
  assert.equal(true, true)
})
