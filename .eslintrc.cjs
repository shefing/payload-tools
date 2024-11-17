/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  // ignorePatterns: ['/src/fields/richtext/snippets/**','/src/access/**'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname, // Optional if your tsconfig.json is not in the root directory
  },
  plugins: ['@typescript-eslint'],
};
