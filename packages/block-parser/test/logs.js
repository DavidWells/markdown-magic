const util = require('util')

function deepLog(myObject, myObjectTwo) {
  let obj = myObject
  if (typeof myObject === 'string') {
    obj = myObjectTwo
    console.log(myObject)
  }
  console.log(util.inspect(obj, false, null, true /* enable colors */))
}

module.exports = {
  deepLog
}