const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = function override(config, env) {
  if (!config.plugins) {
    config.plugins = []
  }
  config.plugins.push(
    new NodePolyfillPlugin({
      excludeAliases: ['console'],
    })
  )
  return config
}
