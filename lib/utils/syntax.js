const html = {
  tags: [
    '<!--', 
    '-->'
  ],
  pattern: [
    '<!-{2,}', 
    '-{2,}>' // '-->'
  ],
}

// Kramdown https://github.com/HHS/nih-oite-website/blob/480244abfd0f0d741b27d6232273dd03073e06ad/app/javascript/kramdown/parser.js#L12-L48

// JS https://regex101.com/r/XKHU18/5
const js = {
  tags: ['/*', '*/'],
  pattern: [
    '\/\\*+',
    // Old ^ '\/\\*{1,}[\n\\*]*',     // '\/\\*+', '\/\*[\*\n\s\t]+', // 
    '\\*+/'
  ],
  /* Match single line JS comment */
  singleLineTag: '//',
  singleLinePattern: '//+',
  singleLine: '\/\/.*$'
}

const jsx = {
  tags: [
    '{/*', 
    '*/}'
  ],
  pattern: [
    '\{\/\\*+',
    '\\*+/\}'
  ]
}

const yaml = {
  tags: ['##', '##'],
  pattern: [
    '##+',
    '##+'
  ],
  singleLineTag: '#',
  singleLinePattern: '#+',
  singleLine: '#.*$',
  content: '[ \\t\\S]*?',
  converter: (str) => {
    return str.split('\n').map((line) => {
      return line[0] === '#' ? line : `#${line}`
    }).join()
  }
}

const syntaxMap = {
  // <!-- x -->
  md: html,
  markdown: html,
  // <!-- x -->
  html: html,
  // /* x */
  js: js,
  // {/* x */}
  jsx: jsx,
  mdx: jsx,
  // ## x ##
  yaml: yaml,
  yml: yaml
}

// Additional comment syntaxes for future
// https://github.com/apidoc/apidoc/tree/27566b48a9e8bad2fb3920c02473940917eabe70#supported-programming-languages

function getSyntaxInfo(syntax = '') {
  return syntaxMap[syntax.toLowerCase()] || {}
}

module.exports = {
  getSyntaxInfo,
  syntaxMap
}