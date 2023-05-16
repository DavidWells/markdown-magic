const util = require('util')
const ansi = require('ansi-styles') // https://github.com/chalk/ansi-styles/blob/main/index.js
const process = require('process')

// via https://github.com/sindresorhus/is-unicode-supported/blob/main/index.js
function isUnicodeSupported() {
  if (process.platform !== 'win32') return process.env.TERM !== 'linux' // Linux console (kernel)
  return Boolean(process.env.CI)
    || Boolean(process.env.WT_SESSION) // Windows Terminal
    || process.env.ConEmuTask === '{cmd::Cmder}' // ConEmu and cmder
    || process.env.TERM_PROGRAM === 'vscode' || process.env.TERM === 'xterm-256color' || process.env.TERM === 'alacritty'
}

const isObject = (obj) => obj !== null && typeof obj === 'object'
function neverNull(obj) {
  const match = (some, none = () => {}) => (obj !== null) ? some(obj) : none()
  return new Proxy((some, none) => {
    if (some) return some === 'string' ? '' : some
    if (!some && !none) return obj
    return match(some, none)
  },
  {
    get: (target, key) => {
      const obj = target()
      if (isObject(obj)) return neverNull(obj[key])
      return neverNull()
    },
    set: (target, key, val) => {
      const obj = target()
      if (isObject(obj)) obj[key] = val
      return true
    },
  })
}

function safeColors(disableColors) {
  return (disableColors) ? neverNull(ansi) : ansi
}

const allowed = isUnicodeSupported()
const styles = safeColors(process.env.DISABLE_COLOR)
const SPACES = '  '
const SUCCESS = allowed ? '✔' : '√'
const INFO = allowed ? 'ℹ' : 'i'
const WARNING = allowed ? '⚠' : '‼'
const ERROR = allowed ? '✖' : '×'

const colors = {
  default: ['white', ''],
  success: ['greenBright', `${SUCCESS}${SPACES}`],
  info: ['cyanBright', `${INFO}${SPACES}`],
  warning: ['yellowBright', `${WARNING}${SPACES}`],
  error: ['redBright', `${ERROR}${SPACES}`]
}

function log(type, msg, customPrefix, noLog) {
  const [color, prefix] = colors[type] || colors.default
  const finalPrefix = typeof customPrefix !== 'undefined' ? customPrefix : prefix
  const logMsg = `${styles[color].open}${finalPrefix}${msg}${styles[color].close}`
  if (noLog) return logMsg
  console.log(logMsg)
}

function deepLog(myObject, myObjectTwo) {
  let obj = myObject
  if (typeof myObject === 'string') {
    obj = myObjectTwo
    console.log(myObject)
  }
  console.log(util.inspect(obj, false, null, true /* enable colors */))
}

const success = log.bind(null, 'success')
const info = log.bind(null, 'info')
const warning = log.bind(null, 'warning')
const error = log.bind(null, 'error')

/*
// Usage:
console.log('Nice logs')
deepLog({ deep: {object }})
success('Success! Yay it worked')
info('Info: Additional details here')
warning('Warning: Watch out')
error('Error: Oh no!')
/**/

module.exports = {
  deepLog,
  success,
  info,
  warning,
  error,
}
