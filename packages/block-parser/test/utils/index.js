function normalizeBlocks(blocks) {
  return blocks.map(block => ({
    index: block.index,
    type: block.type,
    options: block.options,
    openValue: block.open.value,
    contentValue: block.content.value,
    closeValue: block.close.value,
    rawArgs: block.block.rawArgs,
    rawContent: block.block.rawContent,
    blockValue: block.block.value
  }))
}

module.exports = { normalizeBlocks }