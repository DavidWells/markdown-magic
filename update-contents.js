/*
 Update contents between Comment tags
*/
module.exports = function updateContents(block, config) {
  let newContent
  let cmd
  const tag = '<!-- AUTO-GENERATED-CONTENT:'
  const closeTag = '-->'
  const openTagStart = block.indexOf(`${tag}START`)
  const openTagEnd = block.indexOf(closeTag, openTagStart)
  const closeTagStart = block.indexOf(`${tag}END`, openTagEnd)
  if (openTagStart === -1 || openTagEnd === -1 || closeTagStart === -1) {
    console.log('no match found')
    return block
  }
  const originalContent = block.slice(openTagEnd + closeTag.length, closeTagStart).replace(/^\s+|\s+$/g, '')
  const hasCommand = block.slice(openTagStart + tag.length, openTagEnd + closeTag.length).match(/\((.*)\)/)
  console.log('hasCommand', hasCommand)
  if (hasCommand && hasCommand[1]) {
    // check for options after first :
    const hasOptions = hasCommand[1].match(/([^:]*):(.*)/)
    if(hasOptions) {
      cmd = hasOptions[1]
      cmdOptions = hasOptions[2]
    } else {
      // no options found, run command with no options
      cmd = hasCommand[1]
      cmdOptions = null
    }
    // check if command exists
    if (cmd && config.commands && config.commands[cmd]) {
      const options = parseOptions(cmdOptions)
      const filteredContent = config.commands[cmd](originalContent, options, config)
      newContent = filteredContent
      if(!newContent) {
        console.log(`COMMAND '${cmd}' is returning undefined value. using original content instead. Make sure you return a value from your transform`)
      }
    }
    if (!config.commands[cmd]) {
      throw `error ${cmd} command not found`
    }
  }

  // if no transform matches
  if(!newContent) {
    newContent = originalContent
  }

  const beginning = block.slice(0, openTagEnd + closeTag.length)
  const end = block.slice(closeTagStart)
  return `${beginning}
${newContent}
${end}`
}

function parseOptions(options) {
  if(!options) {
    return null
  }
  const returnOptions = {}
  options.split('&').map((opt, i) => {
    const getValues = opt.split('=')
    if (getValues[0] && getValues[1]) {
      returnOptions[getValues[0]] = getValues[1]
    }
  })
  return returnOptions
}

