const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  entry: [
    // "core-js/modules/es6.promise",
    // "core-js/modules/es6.array.iterator",
    "./js/app.js"
  ],
  output: {
    path: __dirname + '/dist',
    filename: 'app.js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: '/bundled-assets/'
  },
  module: {
    rules: [
      {
        test:/\.css$/,
        use: ['style-loader','css-loader']
      },
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        options: {
          plugins: ["syntax-dynamic-import"],
          presets: ['@babel/preset-env', '@babel/preset-react']
        },
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
         runtimeChunk: 'single',
         splitChunks: {
           cacheGroups: {
             vendor: {
               test: /[\\/]node_modules[\\/]/,
               name: 'vendors',
               chunks: 'all'
             }
           }
         }
        },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'app.html',
      hash: true,
      template: 'html/webpack_app_template.html'
    }),
    new webpack.HashedModuleIdsPlugin()
  ]
}
