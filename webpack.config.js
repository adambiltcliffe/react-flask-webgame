var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: [
    "./js/app.js"
  ],
  output: {
    path: __dirname + '/dist',
    filename: 'app.js',
    publicPath: '/bundled-assets/'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'app.html',
      hash: true,
      template: 'html/webpack_app_template.html'
    })
  ],
  mode: 'development',
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  }
};
