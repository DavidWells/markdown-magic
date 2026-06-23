const { findFrontmatter } = require('@davidwells/md-utils/find-frontmatter')
const { removeLeadingH1 } = require('@davidwells/md-utils/string-utils')

function formatMd(content, options = {}) {
  let fileContents = content

  /* automatically trim frontmatter if file is markdown */
  if (options.trimFrontmatter !== false) {
    const frontmatter = findFrontmatter(fileContents)
    if (frontmatter && frontmatter.frontMatterRaw) {
      fileContents = fileContents.replace(frontmatter.frontMatterRaw, '')
    }
  }

  fileContents = selectMarkdownSections(fileContents, options)

  if (options.removeLeadingH1 || options.stripFirstH1) {
    fileContents = removeLeadingH1(fileContents)
  }
  
  // Shift headers up or down by the specified number of levels if shiftHeaders is enabled and file is markdown
  if (options.shiftHeaders) {
    fileContents = fileContents.replace(/^(#{1,6})\s/gm, (match, hashes) => {
      const currentLevel = hashes.length
      const shiftAmount = Number(options.shiftHeaders)
      const newLevel = Math.max(1, Math.min(6, currentLevel + shiftAmount))
      return '#'.repeat(newLevel) + ' '
    })
  }

  return fileContents
}

function selectMarkdownSections(content, options = {}) {
  const requestedSections = [
    ...coerceListOption(options.section),
    ...coerceListOption(options.sections)
  ]
  const requestedHeadings = [
    ...coerceHeadingLevels(options.heading),
    ...coerceHeadingLevels(options.headings)
  ]

  if (!requestedSections.length && !requestedHeadings.length) {
    return content
  }

  const headings = parseMarkdownHeadings(content)
  const sectionNames = requestedSections.map(normalizeHeadingText)
  const ranges = []
  const missingSections = new Set(sectionNames)

  headings.forEach((heading) => {
    if (sectionNames.includes(heading.normalizedText)) {
      ranges.push({ start: heading.start, end: heading.end })
      missingSections.delete(heading.normalizedText)
    }

    if (requestedHeadings.includes(heading.level)) {
      ranges.push({ start: heading.start, end: heading.end })
    }
  })

  if (missingSections.size && !options.allowMissingSections) {
    const missing = Array.from(missingSections).join(', ')
    throw new Error(`Missing markdown section${missingSections.size > 1 ? 's' : ''}: ${missing}`)
  }

  const mergedRanges = mergeRanges(ranges)
  if (!mergedRanges.length) {
    return ''
  }

  return mergedRanges.map((range) => content.slice(range.start, range.end).trim()).join('\n\n')
}

function parseMarkdownHeadings(content) {
  const headings = []
  const lineRegex = /.*(?:\r\n|\n|\r|$)/g
  let match
  let offset = 0
  let fenceMarker = null

  while ((match = lineRegex.exec(content)) !== null) {
    const line = match[0]
    if (!line) break

    const lineText = line.replace(/\r?\n$|\r$/, '')
    const fenceMatch = lineText.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fenceMarker) {
      if (fenceMatch && fenceMatch[1][0] === fenceMarker[0] && fenceMatch[1].length >= fenceMarker.length) {
        fenceMarker = null
      }
      offset += line.length
      continue
    }

    if (fenceMatch) {
      fenceMarker = fenceMatch[1]
      offset += line.length
      continue
    }

    const headingMatch = lineText.match(/^ {0,3}(#{1,6})(?:[ \t]+|$)(.*)$/)
    if (headingMatch) {
      const text = cleanHeadingText(headingMatch[2])
      headings.push({
        level: headingMatch[1].length,
        text,
        normalizedText: normalizeHeadingText(text),
        start: offset,
        end: content.length
      })
    }

    offset += line.length
  }

  headings.forEach((heading, index) => {
    const nextHeading = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level)
    heading.end = nextHeading ? nextHeading.start : content.length
  })

  return headings
}

function cleanHeadingText(text = '') {
  return stripSimpleMarkdownLinks(text.replace(/[ \t]+#+[ \t]*$/, '').trim())
}

function normalizeHeadingText(text = '') {
  return cleanHeadingText(String(text))
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stripSimpleMarkdownLinks(text = '') {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function coerceListOption(value) {
  if (typeof value === 'undefined' || value === null || value === false) {
    return []
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  return String(value)
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function coerceHeadingLevels(value) {
  return coerceListOption(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 6)
}

function mergeRanges(ranges) {
  return ranges
    .filter((range) => range && Number.isInteger(range.start) && Number.isInteger(range.end) && range.end > range.start)
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce((merged, range) => {
      const previous = merged[merged.length - 1]
      if (previous && range.start <= previous.end) {
        previous.end = Math.max(previous.end, range.end)
        return merged
      }
      merged.push({ start: range.start, end: range.end })
      return merged
    }, [])
}

module.exports = {
  formatMd,
  parseMarkdownHeadings,
  selectMarkdownSections,
  normalizeHeadingText,
  coerceListOption,
  coerceHeadingLevels,
  mergeRanges
}
