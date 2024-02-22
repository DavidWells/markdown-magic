const crypto = require('crypto')
const { ReadStream } = require('fs')

function hashFile(filename, algorithm = 'sha1') {
  return new Promise((resolve, reject) => {
    // Algorithm depends on availability of OpenSSL on platform
    // Another algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...
    let shasum = crypto.createHash(algorithm)
    try {
      let s = ReadStream(filename)
      s.on('data', (data) => {
        shasum.update(data)
      })
      // making digest
      s.on('end', () => {
        const hash = shasum.digest('hex')
        return resolve(hash)
      })
    } catch (error) {
      console.log(error)
      return reject(new Error('calc fail'))
    }
  })
}

module.exports = {
  hashFile
}