const { parseBlocks: parseBlocksOptimized } = require('../src/index-1')
const { parseBlocks: parseBlocksOriginal } = require('../src/index')

// Benchmark test data
const testCases = [
  {
    name: 'Simple single block',
    content: `<!-- doc-gen test -->
Content here
<!-- end-doc-gen -->`
  },
  {
    name: 'Multiple blocks',
    content: `
<!-- doc-gen test1 -->
Content 1
<!-- end-doc-gen -->

<!-- doc-gen test2 -->
Content 2
<!-- end-doc-gen -->

<!-- doc-gen test3 -->
Content 3
<!-- end-doc-gen -->
`
  },
  {
    name: 'Complex nested content',
    content: `
<!-- doc-gen complex { foo: "bar", nested: { deep: true } } -->
This is complex content with:
- Multiple lines
- Special characters: !@#$%^&*()
- Nested structures
- <!-- Inner comments -->
<!-- end-doc-gen -->
`
  },
  {
    name: 'Large content with many blocks',
    content: Array.from({ length: 100 }, (_, i) => `
<!-- doc-gen test${i} -->
Content block ${i} with some text that simulates real-world usage
with multiple lines and various characters
<!-- end-doc-gen -->
`).join('\n')
  },
  {
    name: 'Pathological case - many nested patterns',
    content: `
<!-- doc-gen nested -->
${'<!-- '.repeat(1000)}nested comments${'-->'.repeat(1000)}
<!-- end-doc-gen -->
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
    
    // Benchmark optimized version
    const optimizedResults = benchmark(() => {
      parseBlocksOptimized(testCase.content)
    }, testCase.name.includes('Large') ? 100 : 1000)
    
    // Benchmark original version
    const originalResults = benchmark(() => {
      parseBlocksOriginal(testCase.content)
    }, testCase.name.includes('Large') ? 100 : 1000)
    
    console.log('Optimized Version:')
    console.log(`Total time: ${optimizedResults.totalTime.toFixed(2)}ms`)
    console.log(`Average time: ${optimizedResults.avgTime.toFixed(4)}ms`)
    console.log(`Iterations: ${optimizedResults.iterations}`)
    console.log(`Ops/sec: ${(1000 / optimizedResults.avgTime).toFixed(0)}`)
    
    console.log('\nOriginal Version:')
    console.log(`Total time: ${originalResults.totalTime.toFixed(2)}ms`)
    console.log(`Average time: ${originalResults.avgTime.toFixed(4)}ms`)
    console.log(`Iterations: ${originalResults.iterations}`)
    console.log(`Ops/sec: ${(1000 / originalResults.avgTime).toFixed(0)}`)
    
    // Calculate performance improvement
    const improvement = ((originalResults.avgTime - optimizedResults.avgTime) / originalResults.avgTime * 100).toFixed(2)
    console.log(`\nPerformance Improvement: ${improvement}% faster`)
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
    console.log(`${testCase.name}:`)
    
    // Test optimized version
    const optimizedMemoryDelta = trackMemory(() => {
      for (let i = 0; i < 100; i++) {
        if (i === 0) {
          console.log('────────────────────────────── testCase.content ───────────────────────────────')
          console.log(testCase.content)
          console.log()
        }
        const result = parseBlocksOptimized(testCase.content)
      }
    })
    
    // Test original version
    const originalMemoryDelta = trackMemory(() => {
      for (let i = 0; i < 100; i++) {
        const result = parseBlocksOriginal(testCase.content)
      }
    })
    
    console.log('Optimized Version:')
    console.log(`  Heap Used: ${(optimizedMemoryDelta.heapUsed / 1024).toFixed(2)} KB`)
    console.log(`  Heap Total: ${(optimizedMemoryDelta.heapTotal / 1024).toFixed(2)} KB`)
    console.log(`  RSS: ${(optimizedMemoryDelta.rss / 1024).toFixed(2)} KB`)
    
    console.log('\nOriginal Version:')
    console.log(`  Heap Used: ${(originalMemoryDelta.heapUsed / 1024).toFixed(2)} KB`)
    console.log(`  Heap Total: ${(originalMemoryDelta.heapTotal / 1024).toFixed(2)} KB`)
    console.log(`  RSS: ${(originalMemoryDelta.rss / 1024).toFixed(2)} KB`)
    
    // Calculate memory improvement
    const heapUsedImprovement = ((originalMemoryDelta.heapUsed - optimizedMemoryDelta.heapUsed) / originalMemoryDelta.heapUsed * 100).toFixed(2)
    console.log(`\nMemory Improvement: ${heapUsedImprovement}% less heap used`)
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