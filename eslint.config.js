const tseslint = require('typescript-eslint')
const eslintConfigPrettier = require('eslint-config-prettier')
const prettierPlugin = require('eslint-plugin-prettier')

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.test.js',
      '**/*.test.ts',
      'tools/**',
    ],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
      // The codebase uses `any` pervasively (it predates strict linting); keep
      // this non-blocking rather than gating on a repo-wide retype.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
)
