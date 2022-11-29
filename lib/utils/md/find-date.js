const DATE_FORMAT_REGEX = /(([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]))-?/g

function findDate({
  frontmatter = {},
  dateKey = 'date',
  filePath
}) {
  let date = frontmatter[dateKey]
  if (!date && filePath) {
    const dateFromFile = filePath.match(DATE_FORMAT_REGEX)
    if (dateFromFile) {
      date = dateFromFile[0].replace(/-$/, '')
    }
  }
  return convertDateToString(date)
}

function convertDateToString(dateValue) {
  let date = dateValue
  if (typeof dateValue === 'string') {
    date = dateValue
  } else if (dateValue instanceof Date) {
    var newDate = new Date(dateValue.toString())
    date = newDate.toISOString().substring(0, 10)
  }
  return date
}

module.exports = {
  findDate,
  convertDateToString
}