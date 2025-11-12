const concordance = require('concordance')
const ansiStyles = require('ansi-styles').default
const chalk = require('./chalk')

const colorTheme = {
  boolean: ansiStyles.yellow,
  circular: chalk.grey('[Circular]'),
  date: {
    invalid: chalk.red('invalid'),
    value: ansiStyles.blue,
  },
  diffGutters: {
    actual: chalk.red('-') + ' ' + ansiStyles.red.open,
    expected: chalk.green('+') + ' ' + ansiStyles.green.open,
    padding: '  ',
  },
  error: {
    ctor: {
      open: ansiStyles.grey.open + '(',
      close: ')' + ansiStyles.grey.close,
    },
    name: ansiStyles.magenta,
  },
  function: {
    name: ansiStyles.blue,
    stringTag: ansiStyles.magenta,
  },
  global: ansiStyles.magenta,
  item: {
    after: chalk.grey(','),
  },
  list: {
    openBracket: chalk.grey('['),
    closeBracket: chalk.grey(']'),
  },
  mapEntry: {
    after: chalk.grey(','),
  },
  maxDepth: chalk.grey('…'),
  null: ansiStyles.yellow,
  number: ansiStyles.yellow,
  object: {
    openBracket: chalk.grey('{'),
    closeBracket: chalk.grey('}'),
    ctor: ansiStyles.magenta,
    stringTag: {
      open: ansiStyles.magenta.open + '@',
      close: ansiStyles.magenta.close,
    },
    secondaryStringTag: {
      open: ansiStyles.grey.open + '@',
      close: ansiStyles.grey.close,
    },
  },
  property: {
    after: chalk.grey(','),
    keyBracket: { open: chalk.grey('['), close: chalk.grey(']') },
    valueFallback: chalk.grey('…'),
  },
  regexp: {
    source: {
      open: ansiStyles.blue.open + '/',
      close: '/' + ansiStyles.blue.close,
    },
    flags: ansiStyles.yellow,
  },
  stats: { separator: chalk.grey('---') },
  string: {
    /*
    open: ansiStyles.white.open,
    close: ansiStyles.white.close,
    line: {
      open: chalk.white("'"),
      close: chalk.white("'")
    },
     */
    multiline: {
      start: chalk.white('`'),
      end: chalk.white('`')
    },
    controlPicture: ansiStyles.grey,
    diff: {
      /*
      insert: {
        open: ansiStyles.bgGreen.open + ansiStyles.black.open,
        close: ansiStyles.black.close + ansiStyles.bgGreen.close,
      },
      delete: {
        open: ansiStyles.bgRed.open + ansiStyles.black.open,
        close: ansiStyles.black.close + ansiStyles.bgRed.close,
      },
      equal: ansiStyles.white,
      insertLine: {
        open: ansiStyles.green.open,
        close: ansiStyles.green.close,
      },
      deleteLine: {
        open: ansiStyles.red.open,
        close: ansiStyles.red.close,
      },
      */
    },
  },
  symbol: ansiStyles.yellow,
  typedArray: {
    bytes: ansiStyles.yellow,
  },
  undefined: ansiStyles.yellow,
}

const concordanceOptions = {
  maxDepth: 3,
  plugins: [],
  theme: colorTheme
}
const concordanceDiffOptions = {
  maxDepth: 1,
  plugins: [],
  theme: colorTheme
}

function formatDescriptorDiff(actualDescriptor, expectedDescriptor, options) {
  const diffOptions = Object.assign({}, options, concordanceDiffOptions)
  return concordance.diffDescriptors(actualDescriptor, expectedDescriptor, diffOptions)
}

module.exports = function diffValues(actual, expected) {
  const result = concordance.compare(actual, expected, concordanceOptions)
  if (result.pass) {
    return null
  }
  const actualDescriptor = result.actual || concordance.describe(actual, concordanceOptions)
  const expectedDescriptor = result.expected || concordance.describe(expected, concordanceOptions)

  return formatDescriptorDiff(actualDescriptor, expectedDescriptor)
}
