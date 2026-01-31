/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 * Sample Eslint config for NodeJS ExpressJS MongoDB project
 */
module.exports = {
  env: { es2020: true, node: true },
  extends: [
    'eslint:recommended'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    allowImportExportEverywhere: true
  },
  plugins: [],
  rules: {
    // Common
    'no-console': 'warn',
    'no-extra-boolean-cast': 'off',
    'no-lonely-if': 'warn',
    'no-unused-vars': 'warn',
    'no-trailing-spaces': 'warn',
    'no-multi-spaces': 'warn',
    'no-multiple-empty-lines': 'warn',
    'space-before-blocks': ['error', 'always'],
    'object-curly-spacing': ['warn', 'always'],
    'indent': ['warn', 2],
    'semi': ['warn', 'never'],
    'quotes': ['error', 'single'],
    'array-bracket-spacing': 'warn',
    'linebreak-style': 'off',
    'no-unexpected-multiline': 'warn',
    'keyword-spacing': 'warn',
    'comma-dangle': 'warn',
    'comma-spacing': 'warn',
    'arrow-spacing': 'warn'
  }
}