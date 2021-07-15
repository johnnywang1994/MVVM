const { isProd } = process.env.NODE_ENV === 'production';

module.exports = {
  extends: ['airbnb-base'],
  rules: {
    // don't require .js and .ts extension when importing
    'import/extensions': ['error', 'always', { js: 'never', ts: 'never' }],
    // warn debugger during development
    'no-debugger': isProd ? 'error' : 'warn',
    // warn unused vars during development
    'no-unused-vars': isProd ? 'error' : 'warn',
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'import/export': 0,
    'no-underscore-dangle': 0,
    'no-new-func': 0,
    'no-multi-assign': 0,
  },
};
