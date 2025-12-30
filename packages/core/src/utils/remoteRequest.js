const fetch = require('node-fetch')

function formatUrl(url = '') {
  return url.match(/^https?:\/\//) ? url : `https://${url}`
}

async function remoteRequest(url, settings = {}, srcPath) {
  let body
  const finalUrl = formatUrl(url)
  // ignore demo url todo remove one day
  if (finalUrl === 'http://url-to-raw-md-file.md') {
    return
  }
  try {
    const res = await fetch(finalUrl)
    body = await res.text()
  } catch (e) {
    console.log(`⚠️  WARNING: REMOTE URL "${finalUrl}" NOT FOUND`)
    const msg = (e.message || '').split('\n')[0] + `\nFix "${url}" value in ${srcPath}`
    console.log(msg)
    if (settings.failOnMissingRemote) {
      throw new Error(msg)
    }
  }
  return body
}

module.exports = {
  remoteRequest
}

/*
TODO add file caching?
*/
// const path = require('path')
// const cacheManager = require('cache-manager')
// const fsStoreHash = require('cache-manager-fs-hash')
// const CACHE_KEY = 'foo'
// const STORAGE_PATH = (process.env.IS_OFFLINE) ? path.join(__dirname, '../tmp') : '/tmp'
// const SECONDS = 60
// const MINUTES = 60
// const ONE_HOUR = SECONDS * MINUTES
// const mbOfStorage = 512
// /* initialize caching on disk */
// const diskCache = cacheManager.caching({
//   store: fsStoreHash,
//   options: {
//     /* TTL in seconds */
//     ttl: ONE_HOUR,
//     /* max size in bytes on disk */
//     // maxsize: mbOfStorage * 1000 * 1000,
//     path: STORAGE_PATH,
//   }
// })

// async function usage() {
//   const hasCache = await diskCache.get(CACHE_KEY)
//   if (hasCache && hasCache.length) {
//     /* If cache NOT empty return it */
//     // console.log('Using cached value', hasCache)
//     return hasCache
//   }
//   // else do fetch
//   const data = await getStuff()
//   // Then save cache
//   console.log('Saving value')
//   await diskCache.set(CACHE_KEY, data)
// }

// function getCacheSize(filePath) {
//   return new Promise((resolve, reject) => {
//     fs.stat(filePath, (err, stats) => {
//       if (err) {
//         return resolve({ sizeInBytes: 0, sizeInMB: 0 })
//       }
//       const byteSize = stats.size
//       const megaByteSize = byteSize / (1024 * 1024)
//       return resolve({
//         sizeInBytes: byteSize,
//         sizeInMB: megaByteSize
//       })
//     })
//   })
// }