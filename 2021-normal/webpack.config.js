const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';


/**
 * Development mode
 */
const config = {
  mode: process.env.NODE_ENV,
  devtool: false,
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      root: 'View',
    },
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  resolve: {
    extensions: [
      '.js',
      '.json',
    ],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimization: {
    minimizer: [],
  },
};


/**
 * Plugins
 */

config.plugins = [
  new FriendlyErrorsWebpackPlugin(),
];


/**
 * Modules
 */

config.module = {
  rules: [
    {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      include: [path.resolve(__dirname, './src')],
    },
    {
      test: /\.(js|vue)$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      exclude: /node_modules/,
      include: [path.resolve(__dirname, './src')],
      options: { emitWarnings: true },
    },
  ]
};


/**
 * Production mode
 */
if (isProd) {
  const { CleanWebpackPlugin } = require('clean-webpack-plugin');
  const TerserPlugin = require('terser-webpack-plugin');
  config.devtool = false;
  config.output.filename = 'js/[name].[contenthash].js';
  config.plugins.push(new CleanWebpackPlugin());
  config.optimization.minimizer.push(new TerserPlugin());

}

module.exports = config;
