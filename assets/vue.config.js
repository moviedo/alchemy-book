const path = require("path");

module.exports = {
  filenameHashing: false,
  lintOnSave: false,
  outputDir: path.resolve(__dirname, "../priv/static"),

  // delete HTML related webpack plugins
  chainWebpack: config => {
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  }
};
