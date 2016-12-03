const request = require('sync-request')


module.exports = function REMOTE(content, options) {
  return remoteRequest(options.url)
}

function remoteRequest(url) {
  let body
  try {
    const res = request('GET', url)
    body = res.getBody('utf8')
  } catch (e) {
    console.log(`URL NOT FOUND ${url}`)
    throw e
  }
  return body
}

module.exports.remoteRequest = remoteRequest
