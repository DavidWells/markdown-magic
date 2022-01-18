const fs = require('fs')
const path = require('path')
const { processContents } = require('./lib')

let filePath 
let syntax = 'md'

filePath = path.resolve(__dirname, 'test/fixtures/new/test/fixtures/new/go.md')
filePath = path.resolve(__dirname, 'test/fixtures/new/go-simple.md')
// filePath = path.resolve(__dirname, 'test/fixtures/new/gox.js')
// filePath = path.resolve(__dirname, 'test/fixtures/new/g-different-matchword.js')
// filePath = path.resolve(__dirname, 'test/fixtures/new/g-different-matchword-two.js')
// filePath = path.resolve(__dirname, 'test/fixtures/new/g-different-matchword-three.js')
// filePath = path.resolve(__dirname, 'test/fixtures/new/g-different-matchword-four.js')

const transforms = {
  functionName: ({ block }) => {
    // console.log('content', block.content)
    return '\nx' + block.content
  },
  TOC: () => {
    return `
    lol
Table
    
`
  },
  what: (api) => {
    console.log('api', api)
    return '\nx' + api.block.content
  },
  myTransform: ({ block }) => {
    // console.log('content', block.content)
    return 'what' + block.content
  },
  greenie: ({ block, args }) => {
    return 'chill' + block.content
  },
  wow: async ({ block, args }) => {
    return `console.log("${args.foo}")`
  },
  lol: ({ args }) => {
    return JSON.stringify(args, null, 2)
  },
  CODE: ({ block }) => {
    return `
cool

hdhdhdhd
`
  },
  hohoho: () => 'santa'
}

const beforeMiddelwares = [
  { 
    name: 'before-middleware', 
    transform: ({ block }, allContent) => {
      return block.content + 'hi'
    }
  },
  {
    name: 'yess',
    transform: async ({ block }) => {
      return '<!-- lol -->\n' + block.content
    }
  }
]

const afterMiddelwares = [
  // {
  //   name: 'after-middle',
  //   transform: async ({ block }) => {
  //     return '<!-- after -->' + block.content + '<!-- yooo -->'
  //   }
  // },
  {
    name: 'conflicter',
    transform: async ({ block }) => {
      return `<!-- x-gen -->` + block.content + '<!-- x-gen -->'
    }
  }
]

processContents({
  filePath,
  beforeMiddelwares,
  transforms,
  afterMiddelwares,
  open: 'doc-gen',
  close: 'end-doc-gen',
  // word: 'auto-gen',
  // open: 'block',
  // open: '🤖',
  // close: 'end'
  // open: 'block',
  // close: 'block-end',
}).then((fin) => {
  console.log('done', fin)
  fs.writeFileSync(path.resolve(__dirname, '_out.md'), fin.updatedContents)
})