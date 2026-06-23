const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  formatMd,
  parseMarkdownHeadings,
  normalizeHeadingText
} = require('./format-md')

const SAMPLE = `---
title: Example
---
# Package Name

Intro text.

## Installation

Install the package.

### Browser

Browser install notes.

## Usage

Use the package.

### Node

Node usage notes.

## API ##

API docs.

\`\`\`md
## Ignored Code Heading
\`\`\`

## [Contributing](#contributing)

Contribution notes.
`

test('parseMarkdownHeadings finds ATX headings and ignores fenced code headings', () => {
  const headings = parseMarkdownHeadings(SAMPLE)
  assert.equal(
    headings.map((heading) => heading.text),
    ['Package Name', 'Installation', 'Browser', 'Usage', 'Node', 'API', 'Contributing']
  )
})

test('normalizeHeadingText normalizes case, whitespace, closing hashes, and markdown links', () => {
  assert.is(normalizeHeadingText(' Installation ## '), 'installation')
  assert.is(normalizeHeadingText('[Contributing](#contributing)'), 'contributing')
  assert.is(normalizeHeadingText('Quick   Start'), 'quick start')
})

test('formatMd sections selects named sections with nested child headings', () => {
  const result = formatMd(SAMPLE, {
    sections: 'Installation'
  })

  assert.ok(result.includes('## Installation'), 'includes requested section heading')
  assert.ok(result.includes('### Browser'), 'includes nested child heading')
  assert.not.ok(result.includes('## Usage'), 'excludes sibling section')
  assert.not.ok(result.includes('Ignored Code Heading'), 'excludes unrelated fenced code heading')
})

test('formatMd sections accepts arrays and preserves source order', () => {
  const result = formatMd(SAMPLE, {
    sections: ['API', 'Installation']
  })

  assert.ok(result.indexOf('## Installation') < result.indexOf('## API'), 'uses source order')
  assert.ok(result.includes('Install the package.'), 'includes first matched section')
  assert.ok(result.includes('API docs.'), 'includes second matched section')
  assert.not.ok(result.includes('## Usage'), 'excludes unselected middle section')
})

test('formatMd section shorthand works', () => {
  const result = formatMd(SAMPLE, {
    section: 'Usage'
  })

  assert.ok(result.includes('## Usage'), 'includes shorthand section')
  assert.ok(result.includes('### Node'), 'includes shorthand section children')
  assert.not.ok(result.includes('## Installation'), 'excludes previous sibling')
})

test('formatMd combines section and sections options', () => {
  const result = formatMd(SAMPLE, {
    section: 'Installation',
    sections: 'API'
  })

  assert.ok(result.includes('## Installation'), 'includes section shorthand')
  assert.ok(result.includes('## API'), 'includes sections option')
  assert.not.ok(result.includes('## Usage'), 'excludes unselected section')
})

test('formatMd headings selects sections by heading level', () => {
  const result = formatMd(SAMPLE, {
    headings: [3]
  })

  assert.ok(result.includes('### Browser'), 'includes first h3 section')
  assert.ok(result.includes('### Node'), 'includes second h3 section')
  assert.not.ok(result.includes('## Installation'), 'excludes h2 parent')
  assert.not.ok(result.includes('## API'), 'excludes h2 sibling')
})

test('formatMd headings accepts bracketed string values', () => {
  const result = formatMd(SAMPLE, {
    headings: '[3]'
  })

  assert.ok(result.includes('### Browser'), 'includes h3 from bracketed string')
  assert.not.ok(result.includes('## Installation'), 'excludes h2 parent')
})

test('formatMd headings suppresses duplicate nested ranges', () => {
  const result = formatMd(SAMPLE, {
    headings: [2, 3]
  })

  assert.is(result.match(/### Browser/g).length, 1)
  assert.is(result.match(/### Node/g).length, 1)
  assert.ok(result.includes('## Installation'), 'includes h2 section')
  assert.ok(result.includes('## Usage'), 'includes h2 sibling')
})

test('formatMd combines sections and headings as a deduped union', () => {
  const result = formatMd(SAMPLE, {
    sections: 'Usage',
    headings: [3]
  })

  assert.ok(result.includes('### Browser'), 'includes h3 selected by level')
  assert.ok(result.includes('## Usage'), 'includes named section')
  assert.is(result.match(/### Node/g).length, 1)
  assert.not.ok(result.includes('## API'), 'excludes unselected h2')
})

test('formatMd extracts before removeLeadingH1 and shiftHeaders', () => {
  const result = formatMd(SAMPLE, {
    sections: 'Installation',
    removeLeadingH1: true,
    shiftHeaders: 1
  })

  assert.ok(result.includes('### Installation'), 'shifts selected h2 after extraction')
  assert.ok(result.includes('#### Browser'), 'shifts nested h3 after extraction')
  assert.not.ok(result.includes('# Package Name'), 'does not include original leading h1')
})

test('formatMd throws when requested section is missing by default', () => {
  assert.throws(() => {
    formatMd(SAMPLE, {
      sections: 'Missing'
    })
  }, /Missing markdown section: missing/)
})

test('formatMd can ignore missing requested sections', () => {
  const result = formatMd(SAMPLE, {
    sections: 'Missing,Usage',
    allowMissingSections: true
  })

  assert.ok(result.includes('## Usage'), 'includes found section')
  assert.not.ok(result.includes('## Installation'), 'excludes unrequested section')
})

test.run()
