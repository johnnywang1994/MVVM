module.exports = {
  parser: 'vue-eslint-parser',
  extends: [
    'plugin:vue/vue3-recommended'
  ],
  rules: {
    'vue/attribute-hyphenation': 'off',
    'vue/no-v-html': 'off',
    'vue/no-unused-components':
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'vue/no-unused-vars':
      process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
};
