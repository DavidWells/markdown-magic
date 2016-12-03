/*
 Update contents between Comment tags
*/

module.exports = function updateContents(block, config) {
  let newContent
  const openingTag = getOpeningTags(block, config)
  // console.log(openingTag)
  const closingTag = getClosingTags(block, config)
  // console.log(closingTag)

  if (!openingTag.transform) {
    // no transform command return original block
    return block
  }
  const contentStart = openingTag.openTag.length
  const endStart = block.indexOf(closingTag.closeTag, openingTag.openTag.length)
  const originalContent = block.slice(contentStart, endStart).replace(/^\s+|\s+$/g, '')

  if (openingTag.transform) {
    const cmd = openingTag.transform.cmd
    const cmdOptions = openingTag.transform.cmdOptions

    // check if command exists
    if (cmd && config.commands && config.commands[cmd]) {
      const filteredContent = config.commands[cmd](originalContent, cmdOptions, config)
      newContent = filteredContent
      if (!newContent) {
        console.log(`COMMAND '${cmd}' is returning undefined value. using original content instead. Make sure you return a value from your transform`)
      }
    }
    if (!config.commands[cmd]) {
      throw new Error(`error ${cmd} command not found`)
    }
  }

  // if no transform matches
  if (!newContent) {
    newContent = originalContent
  }

  return `${openingTag.openTag}
${newContent}
${closingTag.closeTag}`
}

function parseOptions(options) {
  if (!options) {
    return null
  }
  const returnOptions = {}
  options.split('&').map((opt, i) => { // eslint-disable-line
    const getValues = opt.split('=')
    if (getValues[0] && getValues[1]) {
      returnOptions[getValues[0]] = getValues[1]
    }
  })
  return returnOptions
}

function processTransforms(hasCommand) {
  const hasOptions = hasCommand[1].match(/([^:]*):(.*)/)
  const cmd = (hasOptions) ? hasOptions[1] : hasCommand[1]
  // no options found, run command with no options
  const cmdOptions = (hasOptions) ? hasOptions[2] : null
  return {
    cmd,
    cmdOptions: parseOptions(cmdOptions)
  }
}

function getOpeningTags(block, config) {
  const openTagRegex = new RegExp(`(\\<\\!--(?:.|\\n)*?${config.matchWord}:START)((?:.|\\n)*?--\\>)`, 'g')
  let matches
  while ((matches = openTagRegex.exec(block)) !== null) { // eslint-disable-line
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === openTagRegex.lastIndex) {
      openTagRegex.lastIndex++
    }
    /*
    console.log('FULL Open Tag >>>>>', matches[0])
    console.log('openTag Start', "'"+matches[1]+"'");
    console.log('openTag End', "'"+matches[2]+"'");
    /**/
    const hasCommand = matches[0].match(/\((.*)\)/)
    const cmd = (hasCommand) ? processTransforms(hasCommand) : false
    return {
      openTag: matches[0],
      openTagStart: matches[1],
      openTagEnd: matches[2],
      transform: cmd
    }
  }
}

function getClosingTags(block, config) {
  // pattern
  // ((?:<!--(?:.*|\n)(?:.*|\n))*?AUTO-GENERATED-CONTENT:END)((?:.|\n)*?--\>)
  const closeTagRegex = new RegExp(`((?:\\<\\!--(?:.*|\\n)(?:.*|\\n))*?${config.matchWord}:END)((?:.|\\n)*?--\\>)`, 'g')
  let matches
  while ((matches = closeTagRegex.exec(block)) !== null) { // eslint-disable-line
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === closeTagRegex.lastIndex) {
      closeTagRegex.lastIndex++
    }
    /*
    console.log('FULL CLOSE Tag >>>>>', matches[0])
    console.log('closeTag Start', "'"+matches[1]+"'");
    console.log('closeTag End', "'"+matches[2]+"'");
    /**/
    return {
      closeTag: matches[0],
      closeTagStart: matches[1],
      closeTagEnd: matches[2]
    }
  }
}
