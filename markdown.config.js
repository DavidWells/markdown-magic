/**
 * CLI config example
 * markdown.config.js as default name
 */
module.exports = {
  transforms: {
    /* Match AUTO-GENERATED-CONTENT (LOLZ) */
    LOLZ(content, options) {
      return `new stuff`
    }
  },
  callback: function () {
    console.log('done')
  }
}
