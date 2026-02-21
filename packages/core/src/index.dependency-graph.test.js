const { test } = require('uvu')
const assert = require('uvu/assert')
const { __private } = require('./')

test('createDependencyGraph includes every known dependency edge', () => {
  const blockItems = [
    {
      id: '/docs/main.md',
      blocks: [{}],
      dependencies: ['/docs/dep-a.md', '/docs/dep-z.md']
    },
    {
      id: '/docs/dep-a.md',
      blocks: [{}],
      dependencies: []
    },
    {
      id: '/docs/dep-z.md',
      blocks: [{}],
      dependencies: []
    }
  ]

  const { graph } = __private.createDependencyGraph(blockItems)
  assert.ok(graph.find((edge) => edge[0] === '/docs/main.md' && edge[1] === '/docs/dep-a.md'))
  assert.ok(graph.find((edge) => edge[0] === '/docs/main.md' && edge[1] === '/docs/dep-z.md'))
  assert.is(graph.filter((edge) => edge[0] === '/docs/main.md').length, 2)
})

test('createDependencyGraph skips dependencies outside the file set', () => {
  const blockItems = [
    {
      id: '/docs/main.md',
      blocks: [{}],
      dependencies: ['/docs/dep-a.md', '/external/file.js']
    },
    {
      id: '/docs/dep-a.md',
      blocks: [{}],
      dependencies: []
    }
  ]

  const { graph } = __private.createDependencyGraph(blockItems)
  assert.is(graph.length, 1)
  assert.equal(graph[0], ['/docs/main.md', '/docs/dep-a.md'])
})

test.run()
