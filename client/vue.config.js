const path = require('path');

module.exports = {
  outputDir: path.resolve(__dirname, 'dist'),
  publicPath: './', // Ensures correct loading of assets in Electron
};
