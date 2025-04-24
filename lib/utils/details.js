function details(text, title) {
   const summaryRender = title ? `\n<summary>${title}</summary>` : ''
   return `<details>${summaryRender}

${text
  // Replace leading double spaces
  .replace(/^\n*/g, '')
  // Replace trailing double spaces
  .replace(/\n*$/g, '')
}

</details>`
}

module.exports = details