const prettierConfig = require('./prettier');

module.exports = {
  root: true,
  parser: 'babel-eslint', // default parser
  env: {
    browser: true,
    es6: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json', '.ts', '.tsx'],
      },
      webpack: {
        config: './webpack.config.js', // from root
      },
    },
  },
  overrides: [
  ],
  plugins: ['prettier'],
  extends: ['./airbnb', 'prettier'],
  rules: {
    'prettier/prettier': ['warn', prettierConfig],
  },
};
