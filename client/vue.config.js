const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
import vue from '@vitejs/plugin-vue';

//module.exports = {
//   configureWebpack: {
//     plugins: [new BundleAnalyzerPlugin()]
//   }
// };
module.exports = {
  outputDir: path.resolve(__dirname, 'dist'),
  publicPath: './',
  configureWebpack: {
    plugins: [new BundleAnalyzerPlugin(), 
      vue()],
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxSize: 250000, // Limit chunk size to 250KB
      }
    }
  }
};
