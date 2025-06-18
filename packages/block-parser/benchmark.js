const { parseBlocks } = require('./src/index')

// Benchmark test data
const testCases = [
  {
    name: 'Simple single block',
    content: `<!-- doc-gen:START test -->
Content here
<!-- doc-gen:END -->`
  },
  {
    name: 'Multiple blocks',
    content: `
<!-- doc-gen:START test1 -->
Content 1
<!-- doc-gen:END -->

<!-- doc-gen:START test2 -->
Content 2
<!-- doc-gen:END -->

<!-- doc-gen:START test3 -->
Content 3
<!-- doc-gen:END -->
`
  },
  {
    name: 'Complex nested content',
    content: `
<!-- doc-gen:START complex { foo: "bar", nested: { deep: true } } -->
This is complex content with:
- Multiple lines
- Special characters: !@#$%^&*()
- Nested structures
- <!-- Inner comments -->
<!-- doc-gen:END -->
`
  },
  {
    name: 'Large content with many blocks',
    content: Array.from({ length: 100 }, (_, i) => `
<!-- doc-gen:START test${i} -->
Content block ${i} with some text that simulates real-world usage
with multiple lines and various characters
<!-- doc-gen:END -->
`).join('\n')
  },
  {
    name: 'Pathological case - many nested patterns',
    content: `
<!-- doc-gen:START nested -->
${'<!-- '.repeat(1000)}nested comments${'-->'.repeat(1000)}
<!-- doc-gen:END -->
`
  }
]

function benchmark(fn, iterations = 1000) {
  const start = process.hrtime.bigint()
  
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  
  const end = process.hrtime.bigint()
  const totalTime = Number(end - start) / 1000000 // Convert to milliseconds
  
  return {
    totalTime,
    avgTime: totalTime / iterations,
    iterations
  }
}

function runBenchmarks() {
  console.log('Block Parser Performance Benchmark')
  console.log('===================================\n')
  
  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`)
    console.log('-'.repeat(40))
    
    const results = benchmark(() => {
      parseBlocks(testCase.content)
    }, testCase.name.includes('Large') ? 100 : 1000)
    
    console.log(`Total time: ${results.totalTime.toFixed(2)}ms`)
    console.log(`Average time: ${results.avgTime.toFixed(4)}ms`)
    console.log(`Iterations: ${results.iterations}`)
    console.log(`Ops/sec: ${(1000 / results.avgTime).toFixed(0)}`)
    console.log('')
  })
}

// Memory usage tracking
function trackMemory(fn) {
  const initialMemory = process.memoryUsage()
  
  fn()
  
  const finalMemory = process.memoryUsage()
  
  return {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    rss: finalMemory.rss - initialMemory.rss
  }
}

function runMemoryTests() {
  console.log('Memory Usage Analysis')
  console.log('=====================\n')
  
  testCases.forEach((testCase, index) => {
    const memoryDelta = trackMemory(() => {
      for (let i = 0; i < 100; i++) {
        parseBlocks(testCase.content)
      }
    })
    
    console.log(`${testCase.name}:`)
    console.log(`  Heap Used: ${(memoryDelta.heapUsed / 1024).toFixed(2)} KB`)
    console.log(`  Heap Total: ${(memoryDelta.heapTotal / 1024).toFixed(2)} KB`)
    console.log(`  RSS: ${(memoryDelta.rss / 1024).toFixed(2)} KB`)
    console.log('')
  })
}

if (require.main === module) {
  runBenchmarks()
  runMemoryTests()
}

module.exports = {
  benchmark,
  runBenchmarks,
  runMemoryTests,
  testCases
}