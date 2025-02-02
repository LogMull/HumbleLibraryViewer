const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

//module.exports = {
//   configureWebpack: {
//     plugins: [new BundleAnalyzerPlugin()]
//   }
// };
module.exports = {
  outputDir: path.resolve(__dirname, 'dist'),
  publicPath: './',
  configureWebpack: {
    plugins: [new BundleAnalyzerPlugin()],
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxSize: 250000, // Limit chunk size to 250KB
      }
    }
  }
};
