const stringWidth = require('string-width')

const openPunctuations = [
  '“',
  '‘',
  '（',
  '《',
  '〈',
  '〔',
  '【',

  '(',
  '[',
  '{',
]

function isOpenPunctuation(char) {
  return openPunctuations.includes(char)
}

const closePunctuations = [
  '。',
  '？',
  '！',
  '，',
  '、',
  '；',
  '”',
  '’',
  '）',
  '》',
  '〉',
  '〕',
  '】',

  '.',
  '?',
  '!',
  ',',
  ';',
  ')',
  ']',
  '}',
]

function isClosePunctuation(char) {
  return closePunctuations.includes(char)
}

const otherPunctuations = [
  '：',
  '─',
  '…',
  '·',

  ':',
  '-',
  '–',
  '—',
  '"',
  "'",
]

function isPunctuation(char) {
  return (
    openPunctuations.includes(char) ||
    closePunctuations.includes(char) ||
    otherPunctuations.includes(char)
  )
}

function isFullWidthChar(char) {
  return /[\u4e00-\u9fa5]/.test(char)
}

function getNextBreakPoint(str, width, from, lastIndex) {
  let idealIndex = from
  const length = str.length
  let subWidth = 0

  do {
    idealIndex++
    subWidth = stringWidth(str.slice(from, idealIndex))
  } while (subWidth <= width && idealIndex <= length)

  let index = idealIndex - 1

  if (index >= length) {
    return length
  }

  while (index > lastIndex) {
    const preValue = str.charAt(index - 1)
    const value = str.charAt(index)
    const canBreak =
      preValue === ' ' ||
      value === ' ' ||
      (isFullWidthChar(value) && isFullWidthChar(preValue)) ||
      (isClosePunctuation(preValue) && !isPunctuation(value)) ||
      (!isPunctuation(preValue) && isOpenPunctuation(value)) ||
      (isClosePunctuation(preValue) && isOpenPunctuation(value))

    if (canBreak) {
      break
    } else {
      index--
    }
  }

  if (index <= lastIndex) {
    index = idealIndex
  }

  return index
}

function stringBreak(str, width) {
  if (width < 2) {
    throw new Error('Width must be greater than 2')
  }

  const length = str.length
  let index = 0
  let breakPoint = 0
  let line
  const lines = []

  while (index < length) {
    breakPoint = getNextBreakPoint(str, width, index, breakPoint)
    line = str.slice(index, breakPoint).trim()

    lines.push(line)

    index = breakPoint
  }

  return lines
}

module.exports = stringBreak