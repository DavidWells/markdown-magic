const request = require('sync-request')

module.exports = function remoteRequest(url) {
  let body
  try {
    const res = request('GET', url)
    body = res.getBody('utf8')
  } catch (e) {
    console.log(`WARNING: REMOTE URL ${url} NOT FOUND`)
    console.log(e.message)
  }
  return body
}
