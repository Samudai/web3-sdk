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
      // The codebase predates strict linting and uses `any` and CJS `require`
      // pervasively (it was never linted in CI). Keep these non-blocking so the
      // dependency migration isn't gated on a repo-wide refactor.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
)
