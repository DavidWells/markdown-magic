const resolve = require('path').resolve

const loadJSConfig = getAttemptModuleRequireFn(function onFail(configPath, requirePath) {
  console.log(`Unable to find JS config at "${configPath}". Attempted to require as "${requirePath}"`)
  // log.error({
  //   message: colors.red(`Unable to find JS config at "${configPath}". Attempted to require as "${requirePath}"`),
  //   ref: 'unable-to-find-config',
  // })
  return undefined
})

/**
 * Determines the proper require path for a module. If the path starts with `.` then it is resolved with process.cwd()
 * @param  {String} moduleName The module path
 * @return {String} the module path to require
 */
function getModuleRequirePath(moduleName) {
  return moduleName[0] === '.' ? resolve(process.cwd(), moduleName) : moduleName
}

function getAttemptModuleRequireFn(onFail) {
  return function attemptModuleRequire(moduleName) {
    const requirePath = getModuleRequirePath(moduleName)
    try {
      return requireDefaultFromModule(requirePath)
    } catch (e) {
      if (e.constructor.name === 'SyntaxError') {
        throw e
      }
      return onFail(moduleName, requirePath)
    }
  }
}

/**
 * Requires the given module and returns the `default` if it's an `__esModule`
 * @param  {String} modulePath The module to require
 * @return {*} The required module (or it's `default` if it's an `__esModule`)
 */
function requireDefaultFromModule(modulePath) {
  /* eslint global-require:0,import/no-dynamic-require:0 */
  const mod = require(modulePath)
  if (mod.__esModule) {
    return mod.default
  } else {
    return mod
  }
}

function loadConfig(configPath) {
  // potentially load other types of config files
  return loadJSConfig(configPath)
}

module.exports.loadConfig = loadConfig
