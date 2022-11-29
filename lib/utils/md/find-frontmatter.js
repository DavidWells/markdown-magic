const matter = require('gray-matter')
/* Match <!-- frontmatter --> */
// https://regex101.com/r/Q9bBxC/1
const HIDDEN_FRONTMATTER_REGEX = /^<!--+(?:\r\n|\r|\n)([\w\W]*?)--+>/g
// const HIDDEN_FRONTMATTER_REGEX = /^<!--.*((.|\r?\n)*?.*-->)/g

/* Match --- frontmatter --- */
// https://regex101.com/r/d7eAw4/1
const FRONTMATTER_REGEX = /(^--+(?:\r\n|\r|\n)([\w\W]*?)--+)/
// const FRONTMATTER_REGEX = /^---.*((.|\r?\n)*?.*---)/gm

function removeConflictingContent(str) {
  return str
    .replace(/[\t ]{1}---/g, '__LINE_BREAK__')
    .replace(/[\t ]--+>/g, '__CLOSE_COMMENT__')
    // TODO also handle nested <!-- comments -->
}

function replaceConflictingContent(str) {
  return str
    .replace(/__LINE_BREAK__/g, ' ---')
    .replace(/__CLOSE_COMMENT__/g, ' -->')
}

function findFrontmatterRaw(content = '') {
  const text = removeConflictingContent(content.trim())
  const hasFrontMatter = text.match(FRONTMATTER_REGEX)
  const hasHiddenFrontMatter = text.match(HIDDEN_FRONTMATTER_REGEX)
  let raw = ''
  let match = ''
  let isHidden = false
  // console.log('hasFrontMatter', hasFrontMatter)
  // console.log('hasHiddenFrontMatter', hasHiddenFrontMatter)
  if (hasFrontMatter) {
    raw = hasFrontMatter[1]
    match = raw.trim()
      // Fix Leading frontmatter brackets
      .replace(/^---+/, '---')
      // Trailing frontmatter brackets
      .replace(/--+$/, `---`)
  } else if (hasHiddenFrontMatter) {
    isHidden = true
    raw = hasHiddenFrontMatter[1]
    match = raw.trim()
      // Leading frontmatter brackets
      .replace(/<!--+/, '---')
      // Trailing frontmatter brackets
      .replace(/--+>/, `---`)
  }
  return {
    rawFrontMatter: replaceConflictingContent(raw),
    frontMatter: replaceConflictingContent(match),
    isHidden
  }
}

function findFrontmatter(text) {
  const { frontMatter, rawFrontMatter } = findFrontmatterRaw(text)
  // console.log('frontMatter', frontMatter)
  let frontmatter = { data: {}, content: '' }
  /* Missing all frontmatter */
  if (!frontMatter) {
    // throw new Error(`Missing or broken frontmatter in ${filePath}. Double check file for --- frontmatter tags in files`)
    return frontmatter
  }

  let mdContent = text
  if (rawFrontMatter) {
    mdContent = text
    // Replace frontmatter brackets
    .replace(rawFrontMatter, frontMatter)
    // Replace leading lines
    // .replace(/---+\s+\n/g, '---\n')
  }

  try {
    frontmatter = matter(mdContent)
  } catch (err) {
    /* Add line numbers to output */
    const formattedError = rawFrontMatter.split('\n').map((line, i) => {
      return `${i + 1}. ${line}`
    })
    throw new Error(`Frontmatter error:\n${err.message}\n${formattedError.join('\n')}`)
  }
  // console.log('frontMatter', frontmatter)
  return Object.assign(frontmatter, { rawFrontMatter })
}

module.exports = {
  findFrontmatter,
  findFrontmatterRaw,
  HIDDEN_FRONTMATTER_REGEX,
  FRONTMATTER_REGEX
}