const IMAGE_POSTFIX_REGEX = /\.(png|apng|jpe?g|gif|webp|svg|avif)$/
const RELATIVE_LINK_REGEX = /^(?!(?:(?:https?|ftp):\/\/|data:))((?:\.\.?\/)*)*([\w\d\-_./?=#%:+&]+)/

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

function isImage(link = '') {
  return link.match(IMAGE_POSTFIX_REGEX)
}

function isRelative(filepath = '') {
  return RELATIVE_LINK_REGEX.test(filepath)
}

module.exports = {
  onlyUnique,
  isImage,
  isRelative
}