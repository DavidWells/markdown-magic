function getTextBetweenChars(text, start, end) {
  return text.slice(start, end)
}

// https://github.com/jamiebuilds/min-indent/blob/master/index.js
function findMinIndent(string) {
	const match = string.match(/^[ \t]*(?=\S)/gm)
	if (!match) return 0
	return match.reduce((r, a) => Math.min(r, a.length), Infinity)
}

module.exports = {
  getTextBetweenChars,
  findMinIndent
}