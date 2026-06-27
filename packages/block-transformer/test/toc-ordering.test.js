const { test } = require('uvu')
const assert = require('uvu/assert')
const { blockTransformer } = require('../src')

/**
 * Regression: TOC/sectionToc blocks are sorted to run LAST (so they see other
 * transforms' output), but the position-based replacement used a single
 * cumulativeOffset that assumes blocks are processed in document order. When a
 * TOC block sits ABOVE another block, processing it last with the accumulated
 * offset of the (lower) block shifted its replacement position, corrupting both
 * blocks. See blockTransformer reconstruction loop.
 */
test('TOC block above another block is not corrupted by out-of-order processing', async () => {
  const text = [
    '# Title',
    '',
    '## TOC',
    '<!-- block TOC -->',
    'old toc',
    '<!-- /block -->',
    '',
    '## Body',
    'body text here',
    '',
    '## API',
    '<!-- block API -->',
    'old api',
    '<!-- /block -->',
    '',
  ].join('\n')

  const config = {
    transforms: {
      // TOC must run after API so it can see API's generated headings
      TOC: () => '- [Body](#body)\n- [API](#api)',
      // API returns content much longer than the original block
      API: () => Array.from({ length: 12 }, (_, i) => `### method${i}\n\ndescription ${i}`).join('\n\n'),
    },
  }

  const result = await blockTransformer(text, config)
  const out = result.updatedContents

  // Markers stay balanced — exactly the two original blocks, no duplication
  assert.is((out.match(/<!-- block /g) || []).length, 2, 'should have exactly 2 open tags')
  assert.is((out.match(/<!-- \/block -->/g) || []).length, 2, 'should have exactly 2 close tags')

  // Inter-block content between the two blocks is preserved
  assert.ok(out.includes('## Body'), 'inter-block heading preserved')
  assert.ok(out.includes('body text here'), 'inter-block text preserved')

  // Each transform's output landed inside its own block
  assert.ok(out.includes('- [Body](#body)'), 'TOC output present')
  assert.ok(out.includes('### method0'), 'API output present')

  // No mangled/duplicated open marker like "<!-- block TOC <!-- block TOC -->"
  assert.not.ok(/<!-- block TOC[^>]*<!-- block/.test(out), 'open marker should not be duplicated')
})

test.run()
