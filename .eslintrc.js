module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    // React specific rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Forex calculator specific rules
    'no-magic-numbers': [
      'warn',
      {
        ignore: [0, 1, -1, 2, 10, 100, 1000],
        ignoreArrayIndexes: true,
      },
    ],
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
