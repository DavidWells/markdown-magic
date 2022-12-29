const { onlyUnique, isImage, isRelative } = require('./filters')

// Alt https://github.com/MikeKovarik/link-extract

// https://regex101.com/r/In5HtG/3
const LIVE_LINKS_REGEX = /(?:['"(])((?:https?:\/\/)[\w\d\-_,./?=#%:+&]{3,})/gmi
// https://regex101.com/r/Nywerx/3
const RELATIVE_LINKS_REGEX = /(src|href|\()=?(['"/])(?!(?:(?:https?|ftp):\/\/|data:))(\.?\/)?([\w\d-_./,?=#%:+&]+)(?:['")])?/gim
// https://regex101.com/r/u2DwY2/2/
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g

const LINK_PATTERN = /^https?:\/\//

function isLocal(link) {
  return isRelative(link)
}

function isRemote(link) {
  return !isRelative(link)
}

/**
 * Finds all links in text relative or otherwise
 * @param {string} mdContents 
 * @returns 
 */
function findLinks(text, opts = {}) {
  const { unique = true } = opts
  const live = findLiveLinks(text)
  const relative = findRelativeLinks(text)
  const normalLinks = live.concat(relative)
  const mdImgLinks = findMarkdownImageLinks(text)


  let frontmatterLinks = []
  if (opts.frontmatter) {
    frontmatterLinks = findLinksInFrontMatter(opts.frontmatter, findLinks)
  }

  const allLinks = normalLinks.concat(mdImgLinks).concat(frontmatterLinks)
  const all = (!unique) ? allLinks : allLinks.filter(onlyUnique)
  
  let images = mdImgLinks
  let links = []
  for (let i = 0; i < all.length; i++) {
    const link = all[i]
    if (isImage(link)) {
      images.push(link)
    } else {
      links.push(link)
    }
  }
  // const allImages = normalLinks.filter((link) => isImage(link)).concat(mdLinks)
  // const links = normalLinks.filter((link) => !isImage(link))
  const allImg = images.filter(onlyUnique)
  const allLink = links.filter(onlyUnique).filter(function(el) {
    return allImg.indexOf(el) < 0
  })
  return {
    // all,
    // live,
    // relative,
    // frontmatter: frontmatterLinks,
    links: {
      all: allLink,
      relative: allLink.filter(isLocal),
      live: allLink.filter(isRemote)
    },
    images: {
      all: allImg,
      relative: allImg.filter(isLocal),
      live: allImg.filter(isRemote)
    },
  }
}

function findMarkdownImageLinks(text) {
  let matches
  let imageLinks = []
  while ((matches = MARKDOWN_IMAGE_REGEX.exec(text)) !== null) {
    if (matches.index === MARKDOWN_IMAGE_REGEX.lastIndex) {
      MARKDOWN_IMAGE_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, image, altText ] = matches
    imageLinks.push(image)
  }
  return imageLinks.filter(onlyUnique)
}

/**
 * Finds all links in markdown <a>, <img> and md link format []()
 * @param {string} text
 * @returns 
 */
function findLiveLinks(text) {
  let matches
  let links = []
  while ((matches = LIVE_LINKS_REGEX.exec(text)) !== null) {
    if (matches.index === LIVE_LINKS_REGEX.lastIndex) {
      LIVE_LINKS_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [ match, url ] = matches
    links.push(url)
  }
  return links.filter(onlyUnique)
}

/*
Match relative links
<h1 jdjdjjdjd=lksjskljfsdlk="jdjdj">Netlify + FaunaDB &nbsp;&nbsp;&nbsp; 
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/netlify/netlify-faunadb-example&stack=fauna">
  <img src="../../../../img/deploy/lol.svg">
  </a>
</h1>
[link](/my-great-page)
<a href="img/deploy/one.svg">cool</a>
<img src="img/deploy/duplicate.svg" />
<img src="img/deploy/duplicate.svg" >
<img src="/img/deploy/three.svg" />
<img src='/img/deploy/four.svg' />
<img src='./img/deploy/five.svg' />
<img src='../img/deploy/button.svg' />
<img src='../../img/deploy/button.svg' />
<img src="https://www.netlify.com/img/deploy/button.svg" />
<img src="https://www.netlify.com/img/deploy/button.svg" />
![The San Juan Mountains are beautiful!](/assets/images/san-juan-mountains.jpg "San Juan Mountains")
*/

function findRelativeLinks(text) {
  let matches
  let relLinks = []
  while ((matches = RELATIVE_LINKS_REGEX.exec(text)) !== null) {
    if (matches.index === RELATIVE_LINKS_REGEX.lastIndex) {
      RELATIVE_LINKS_REGEX.lastIndex++ // avoid infinite loops with zero-width matches
    }
    // console.log(matches)
    const [ match, _, start, link, x ] = matches
    const one = (start === '/') ? start : ''
    const two = (link === '/') ? link : ''
    relLinks.push(`${one}${two}${x}`)
  }
  return relLinks.filter(onlyUnique)
}

function findLinksInFrontMatter(data, linkFinder) {
  const yamlStrings = traverse(data)
  const linksInYml = yamlStrings.map((string) => {
    if (LINK_PATTERN.test(string)) {
      return [string]
    }
    // console.log('string', string)
    return linkFinder(string)
  })
  .filter((x) => {
    if (Array.isArray(x)) {
      return x.length
    }
    if (x && x.all) {
      return x.all.length
    }
    return true
  })
  .map((x) => {
    if (typeof x === 'string') {
      return x
    }
    if (typeof x === 'object' && x.all) {
      return x.all
    }
    return x
  })
  .flat()
  // console.log('linksInYml', linksInYml)
  return linksInYml
}

function traverse(x, arr = []) {
  if (typeof x === 'string') {
    arr.push(x)
  } else if (isArray(x)) {
    traverseArray(x, arr)
  } else if ((typeof x === 'object') && (x !== null)) {
    traverseObject(x, arr)
  }
  return arr
}
function traverseArray(arr, acc) {
  arr.forEach((x) => traverse(x, acc))
}
function traverseObject(obj, acc) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) traverse(obj[key], acc)
  }
}

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]'
}

module.exports = {
  findLinks,
  findLiveLinks,
  findRelativeLinks
}
