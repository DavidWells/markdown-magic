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

const js = {
  tags: ['/*', '*/'],
  pattern: [
    '\/\\*{1,}[\n\\*]*', // '\/\\*+', '\/\*[\*\n\s\t]+', // 
    '\\*+/'
  ],
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

function getSyntaxInfo(syntax = '') {
  return syntaxMap[syntax.toLowerCase()] || {}
}

module.exports = {
  getSyntaxInfo,
  syntaxMap
}