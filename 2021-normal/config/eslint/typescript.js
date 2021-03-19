module.exports = {
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Checked by Typescript - ts(2378)
    'getter-return': 'off',
    // Checked by Typescript - ts(2300)
    'no-dupe-args': 'off',
    // Checked by Typescript - ts(1117)
    'no-dupe-keys': 'off',
    // Checked by Typescript - ts(7027)
    'no-unreachable': 'off',
    // Checked by Typescript - ts(2367)
    'valid-typeof': 'off',
    // Checked by Typescript - ts(2588)
    'no-const-assign': 'off',
    // Checked by Typescript - ts(2588)
    'no-new-symbol': 'off',
    // Checked by Typescript - ts(2376)
    'no-this-before-super': 'off',
    // This is checked by Typescript using the option `strictNullChecks`.
    'no-undef': 'off',
    // This is already checked by Typescript.
    'no-dupe-class-members': 'off',
    // This is already checked by Typescript.
    'no-redeclare': 'off',

    // Add TypeScript specific rules (and turn off ESLint equivalents)
    '@typescript-eslint/consistent-type-assertions': 'warn',
    'no-array-constructor': 'off',
    '@typescript-eslint/no-array-constructor': 'error',
    '@typescript-eslint/no-namespace': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: true,
        classes: true,
        variables: true,
        typedefs: true,
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
    ],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
  },
};
